import { Component, ViewChild } from '@angular/core';
import { List } from 'ionic-angular';
import { NavController } from 'ionic-angular';
import { RelaysService } from '../../app/service.relays';
import { ToastController } from 'ionic-angular';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  // this is here so one can close the sliding item when the user hits a button
  // example: this.list.closeSlidingItems();
  @ViewChild(List) list: List;


  // bulb animations
  public bulbLottieConfig: Object;

  public logoLottieConfig: Object;
  public logoAnim: any;

  constructor(public navCtrl: NavController,
    public toastCtrl: ToastController,
    public relaysService: RelaysService
  ) {

    this.bulbLottieConfig = {
      path: 'assets/dataOn.json',
      renderer: 'canvas',
      autoplay: false,
      loop: false
    };

    this.logoLottieConfig = {
      path: 'assets/RelaysLogo.json',
      renderer: 'canvas',
      autoplay: true,
      loop: false
    };

  }

  // we refresh the gates info
  ionViewDidLoad() {
    this.relaysService.initAnims();
  }

  /*******************************************************************************
********************************************************************************
********************************************************************************
ANIMATIONS FUNCTIONS
********************************************************************************
********************************************************************************
*******************************************************************************/

  // this initializes the logo animation
  logoHandleAnimation(anim: any) {
    this.logoAnim = anim;
  }


  /*******************************************************************************
********************************************************************************
********************************************************************************
BUTTONS FUNCTIONS
********************************************************************************
********************************************************************************
*******************************************************************************/

  updateRelay(index: number, command: string) {

    this.list.closeSlidingItems();

    this.relaysService.updateRelay(index, command);
    // .subscribe
    // (result => {
    //   // console.log("result:", result);
    //   // inform the user of the result
    //   // this.presentToastWrapper(result);
    // },
    // (error) => {
    //   console.error("boom: ", error);
    //   this.presentToastWrapper("-1");
    // });
  }

  pulseRelay(index: number) {

    this.list.closeSlidingItems();

    this.relaysService.pulseRelay(index);
  }

  /*******************************************************************************
  ********************************************************************************
  ********************************************************************************
  UI FUNCTIONS
  ********************************************************************************
  ********************************************************************************
  *******************************************************************************/

  // result is the returned value from the api call
  // -1 means call failed
  presentToastWrapper(result: string) {
    let toastMsg = "✔";

    //if the cloud function failed due to network issues it returns a -1
    //if the cloud function failed due to the firm not able to execute it returns a 0
    if (result == "0") {
      toastMsg = "✔";
      this.presentToast(toastMsg, false);
      return;
    }

    toastMsg = "Command failed!";
    this.presentToast(toastMsg, true);
  }

  presentToast(message: string, showCloseButton = false) {
    let duration = 3000;
    if (showCloseButton) {
      duration = 0;
    }
    console.log("calling toast");
    let toast = this.toastCtrl.create({
      message: message,
      duration: duration,
      showCloseButton: showCloseButton,
      closeButtonText: "Got it",
      dismissOnPageChange: true
    });
    toast.present();
  }

  async doRefresh(refresher) {
    console.log('Begin async operation', refresher);
    this.relaysService.gatesForceRefresh();

    // this sleeps for some time for better UX (we show more time the refresher)
    await new Promise(resolve =>
      setTimeout(resolve, 1000)
    );

    console.log('Async operation has ended');
    refresher.complete();
    // this.navCtrl.setRoot(this.navCtrl.getActive().component);
  }

}
