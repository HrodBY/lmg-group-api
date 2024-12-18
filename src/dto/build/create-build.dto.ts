import { $Enums } from "@prisma/client";

export interface CreateBuildDto {
  coordinates?: [number, number][];
  name?: string;
  wDescription?: string;
  gTitle?: string;
  gSubTitle?: string;
  list?: ModalList[];
  status: $Enums.ContentSatus;
  categoryAreaId?: string;
}

export interface ModalList {
    title?: string;
    value?: string;
}