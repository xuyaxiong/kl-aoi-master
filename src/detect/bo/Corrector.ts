import { ImagePtr } from '../../camera/camera.bo';
import { CapPos } from '../../plc/plc.bo';

export class Corrector {
  private pos1: CapPos;
  private pos2: CapPos;
  private imgPtr1: ImagePtr;
  private imgPtr2: ImagePtr;

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
  }
}
