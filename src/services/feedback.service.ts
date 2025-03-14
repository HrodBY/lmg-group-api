import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { createReadStream } from 'fs';
import { FileService } from './file.service';
import { GetFeedbackDto } from 'src/dto/feedback/get-feedback.dto';
import { CreateFeedbackDto } from 'src/dto/feedback/create-feedback.dto';
import { UpdateFeedbackStatusDto } from 'src/dto/feedback/update-feedback-status.dto';
import { UpdateFeedbackDto } from 'src/dto/feedback/update-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService, 
    private fileService: FileService
  ) {}

  async getById(id: string): Promise<GetFeedbackDto | null> {
    const answer =  await this.prisma.feedback.findUnique({
      where: {id},
    });
    if(!answer) return null;

    return {
      id: answer?.id,
      number: answer?.number,
      title: answer?.title,
      description: answer?.description,
      status: answer?.status,
      videoId: answer?.videoId,
      pictureId: answer?.pictureId,
    };
  }

  async getAll(): Promise<GetFeedbackDto[]> {
    const answer =  await this.prisma.feedback.findMany({orderBy: {
      number: 'asc'
    }});

    return answer?.map(item => {
      return {
        id: item?.id,
        number: item?.number,
        title: item?.title,
        description: item?.description,
        status: item?.status,
        videoId: item?.videoId,
        pictureId: item?.pictureId,
      };
    })
  }

  async create(fileInfo?: {path?: string, name?: string, type?: string}, videoInfo?: {filename?: string, originalname?: string, path?: string}, data?: CreateFeedbackDto): Promise<any> {
    console.log({fileInfo, videoInfo});
    const picture = await this.addPicture(fileInfo);
    const video = await this.addVideo(videoInfo);
    console.log({picture, video});
    return await this.prisma.feedback.create({
      data :{...data, pictureId: picture?.id || null, videoId: video?.id || null}
    });
  }

  async update(fileInfo?: {path?: string, type?: string, name?: string}, videoInfo?: {filename?: string, originalname?: string, path?: string}, data?: UpdateFeedbackDto): Promise<any> {
    const updateItem = await this.getById(data?.id);

    let pictureId = data?.pictureId;
    if(fileInfo?.path){
      const picture = await this.addPicture(fileInfo);
      pictureId = picture?.id;
      await this.prisma.picture.deleteMany({
        where : {
          id: updateItem?.pictureId || ''
        }
      });
    }

    let videoId = data?.videoId;

    if(videoInfo?.path)
    {
      const video = await this.addVideo(videoInfo);
      videoId = video?.id;
      await this.prisma.video.deleteMany({
        where : {
          id: updateItem?.videoId || ''
        }
      });
    }
    
    return await this.prisma.feedback.update({
      where:{
        id: data.id,
      },
      data :{...data, pictureId: pictureId || null, videoId: videoId || null}
    });
  }

  async delete(id: string): Promise<any> {
    const deleteItem = await this.getById(id);

    await this.prisma.picture.deleteMany({
      where : {
        id: deleteItem?.pictureId || ''
      }
    });

    return await this.prisma.feedback.delete({
      where: {id},
    });
  }

  async updateStatus(data: UpdateFeedbackStatusDto): Promise<GetFeedbackDto> {
    const currentItem = await this.getById(data?.feedbackId);
    if(!currentItem) return null;
    await this.prisma.feedback.update({
      where:{
        id: data.feedbackId,
      },
      data: {
        status: data?.status ?? currentItem.status,
      },
    });

    return await this.getById(currentItem.id);
  }

  private async addPicture(file?: {path?: string, name?: string, type?: string}){
    let fileData: Buffer;
    let picture;

    if(file?.path){
      const fileStream = createReadStream(file.path);
      const chunks = [];
  
      for await (const chunk of fileStream) {
        chunks.push(chunk);
      }
  
      fileData = Buffer.concat(chunks);
      picture = await this.prisma.picture.create({
        data: {
          picture: fileData,
          name: file.name,
          type: file.type || 'image/png',
        },
      });

      await this.fileService.deleteFile(file?.path);
    }
    console.log(picture);
    return picture || null;
  }

  private async addVideo(videoInfo?: {filename?: string, originalname?: string, path?: string}){
    let video;
    if(videoInfo?.path){
      video = await this.prisma.video.create({
        data: videoInfo,
      });
    }
    return video || null;
  }
}