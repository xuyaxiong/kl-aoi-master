import { ImagePtr } from '../../camera/camera.bo';
import { CapPos } from '../../plc/plc.bo';
import { saveImagePtrSync } from '../../utils/image_utils';

export class Corrector {
  private pos1: CapPos;
  private pos2: CapPos;
  private imgPtr1: ImagePtr;
  private imgPtr2: ImagePtr;

  constructor(private outputPath: string) {}

  public setPos1(pos1: CapPos) {
    this.pos1 = pos1;
  }

  public setPos2(pos2: CapPos) {
    this.pos2 = pos2;
  }

  public setImg1(imgPtr1: ImagePtr) {
    this.imgPtr1 = imgPtr1;
  }

  public setImg2(imgPtr2: ImagePtr) {
    this.imgPtr2 = imgPtr2;
  }

  public correct() {
    console.log(this.pos1, this.pos2, this.imgPtr1, this.imgPtr2);
    // 保存纠偏定位图片
    const pos1Name = `${this.imgPtr1.frameId}_${this.pos1.x}_${this.pos1.y}.jpg`;
    const pos2Name = `${this.imgPtr2.frameId}_${this.pos2.x}_${this.pos2.y}.jpg`;
    const dir = path.join(this.outputPath, 'correction');
    saveImagePtrSync(this.imgPtr1, dir, pos1Name);
    saveImagePtrSync(this.imgPtr2, dir, pos2Name);
  }
}
