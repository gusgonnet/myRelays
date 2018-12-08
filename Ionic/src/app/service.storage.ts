// this is a singleton
// source: 
// https://stackoverflow.com/questions/43387855/singletons-in-ionic-3-angular-4

import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { ParticleCredentials } from './interface.particle';


@Injectable()
export class StorageService {

  particleAccessTokenName: string = "ParticleAccessTokenMyRelays";
  particleDeviceIDName: string = "ParticleDeviceIDMyRelays";

  constructor(public storage: Storage) {
  }

  emtpyValue(parameter: any): boolean {
    if (parameter == "" || parameter == null || parameter == undefined) {
      return true;
    }
    return false;
  }


  readStorage(): Promise<ParticleCredentials> {

    let promise = new Promise<ParticleCredentials>((resolve, reject) => {

      this.storage.ready().then(() => {

        // this Promise.all waits for all values to be loaded from storage
        // source: https://stackoverflow.com/questions/43395691/getting-multiple-key-values-from-ionic2-storage
        Promise.all([
          this.storage.get(this.particleAccessTokenName),
          this.storage.get(this.particleDeviceIDName)
        ]).then(values => {
          let localVar: ParticleCredentials = {
            particleToken: values[0],
            deviceId: values[1]
          };

          console.log('ReadStorage: ', localVar);
          resolve(localVar);
        });
      });
    });

    return promise;
  }

  saveInStorage(varToBeSaved: ParticleCredentials) {
    console.log('saveInStorage: ', varToBeSaved);
    this.storage.set(this.particleAccessTokenName, varToBeSaved.particleToken);
    this.storage.set(this.particleDeviceIDName, varToBeSaved.deviceId);
  }

}
