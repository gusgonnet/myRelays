import { Component } from '@angular/core';
import { ToastController } from 'ionic-angular';
import { StorageService } from '../../app/service.storage';
import { ParticleCredentials } from '../../app/interface.particle';
import { RelaysService } from '../../app/service.relays';


@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {

  particleAccessToken: string;
  particleDeviceID: string;

  constructor(
    public toastCtrl: ToastController,
    public storage: StorageService,
    public relaysService: RelaysService
  ) {
  }

  saveClick() {
    let localVar: ParticleCredentials = {
      particleToken: this.particleAccessToken,
      deviceId: this.particleDeviceID
    };
    console.log('about to save: ', localVar);
    this.storage.saveInStorage(localVar);
    // reload relay array with new particle creds
    this.relaysService.initRelays(true);
    this.presentToast("Settings saved");
  }

  cancelClick() {
    this.refreshValues();
    this.presentToast("Changes were discarded");
  }

  refreshValues() {
    this.storage.readStorage()
      .then((values) => {
        this.particleAccessToken = values.particleToken;
        this.particleDeviceID = values.deviceId;
        console.log('refreshing: ', values);
      });

  }

  ionViewDidLoad() {
    this.refreshValues();
  }

  /*******************************************************************************
  ********************************************************************************
  ********************************************************************************
  UI FUNCTIONS
  ********************************************************************************
  ********************************************************************************
  *******************************************************************************/

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

}
