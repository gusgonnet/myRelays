// this is a singleton
// source: 
// https://stackoverflow.com/questions/43387855/singletons-in-ionic-3-angular-4

import { Injectable } from '@angular/core';
import { ParticleService } from './service.particle';
import { Subscription } from 'rxjs/Rx';
import { timer } from 'rxjs/observable/timer';
import { StorageService } from '../app/service.storage';
import { Relay, Relays, ParticleCredentials } from './interface.particle';
import { Observable } from 'rxjs/Observable'
import { SmartAudio } from '../app/smart-audio';
import { Vibration } from '@ionic-native/vibration';


@Injectable()
export class RelaysService {

  private MAX_NUMBER_OF_RELAYS: number = 4;
  public relays: Relays;

  private notAvailable: string = "Getting status...";

  TIMER_TIMEOUT: number = 300; // msecs

  // how many seconds to wait until a command to the cloud expires
  CLOUD_COMMAND_TIMEOUT_IN_SECONDS: number = 35;
  CLOUD_COMMAND_TIMEOUT: number = this.CLOUD_COMMAND_TIMEOUT_IN_SECONDS * 1000 / this.TIMER_TIMEOUT;

  relaysBackgroundRefreshTimer = timer(1000, 3000);
  relaysBackgroundRefreshTimerSubscribe: Subscription;

  constructor(
    public particleService: ParticleService,
    public storage: StorageService,
    public smartAudio: SmartAudio,
    public vibration: Vibration
  ) {
    // this starts the background refresh timer for the relays
    this.relaysBackgroundRefreshTimerSubscribe = this.relaysBackgroundRefreshTimer
      .subscribe(seconds => this.relaysBackgroundRefreshTimerTimeout(seconds));

    this.initRelays();
  }


  initRelays(force: boolean = false) {

    if (!force) {
      try {
        if (this.relays.initDone) {
          return;
        }
      } catch (error) {
      }
    }

    this.relays = this.initRelaysVariable(
      { particleToken: "", deviceId: "" });

    this.storage.readStorage()
      .then((values) => {

        console.log('initRelays: ', values);

        if (this.storage.emtpyValue(values.particleToken)) {
          return;
        }

        if (this.storage.emtpyValue(values.deviceId)) {
          return;
        }

        this.relays = this.initRelaysVariable(
          { particleToken: values.particleToken, deviceId: values.deviceId });
      });

  }

  initRelaysVariable(particleCredentials: ParticleCredentials): Relays {

    let relays: Relays = {
      initDone: true,
      particleCredentials: particleCredentials,
      refreshOngoing: false,

      relay: this.getRelaysArray(this.MAX_NUMBER_OF_RELAYS),

      backgroundRefreshTimer: timer(1000, 2000),
      backgroundRefreshTimerSubscribe: null,

      subscription: null,

      anims: []
    };

    return relays;
  }

  getRelaysArray(numberOfRelays: number): Array<Relay> {
    let tempArray: Array<Relay> = [
      { state: this.notAvailable, buttonsEnabled: true },
      { state: this.notAvailable, buttonsEnabled: true },
      { state: this.notAvailable, buttonsEnabled: true },
      { state: this.notAvailable, buttonsEnabled: true }
    ];

    tempArray = tempArray.slice(0, numberOfRelays);

    return tempArray;

  }


  /*******************************************************************************
********************************************************************************
********************************************************************************
 TIMER FUNCTIONS
********************************************************************************
********************************************************************************
*******************************************************************************/

  // this function refreshes the status in the background
  async relaysBackgroundRefreshTimerTimeout(seconds: number) {
    // console.log("Refreshing relays status");
    if (!this.relays.refreshOngoing) {
      this.relays.refreshOngoing = true;
      await this.refreshStatusRelays();
      this.relays.refreshOngoing = false;
    }
  }

  refreshStatusRelays() {

    this.relays.subscription = this.particleService.getCloudVariable(this.relays.particleCredentials, "relaysState")
      .subscribe(result => {

        try {

          for (let index = 0; index < Array.from(result).length; index++) {
            if (result[index] == "0") {
              this.relays.relay[index].state = "OFF";
            } else {
              // if (this.relays.relay[index].state == this.notAvailable) {
              this.relays.anims[index].goToAndStop(48, true);
              // }
              this.relays.relay[index].state = "ON";
            }
          }

          // shorten the relay array so we show only the number of relays the firmware supports
          // the firmware returns "00" for two relays, "0" for one or "0000" for four relays
          this.relays.relay = this.relays.relay.slice(0, Array.from(result).length);

          console.log("Relays status refreshed");

        }
        catch (e) {
          console.error("No data returned from the cloud variable relaysState?");
        }
      },
        (error) => {
          console.error("boom: ", error);
        });

  }

  // this function will cancel ongoing request
  gatesCancelOngoing() {

    if (this.relays.subscription) {
      this.relays.subscription.unsubscribe;
    }
  }

  // this function will 
  // re-enable buttons and clear few variables
  gatesForceRefresh() {

    if (this.relays.subscription) {
      this.relays.subscription.unsubscribe;
    }
    this.relays.refreshOngoing = false;
    this.relays.relay = this.getRelaysArray(this.relays.relay.length);

  }

  /*******************************************************************************
  ********************************************************************************
  ********************************************************************************
  BUTTONS FUNCTIONS
  ********************************************************************************
  ********************************************************************************
  *******************************************************************************/

  // command values accepted: "on" "off"
  updateRelay(index: number, command: string) {

    this.gatesCancelOngoing();

    // disable buttons
    this.relays.relay[index].buttonsEnabled = false;

    this.animationPlay(index, command);
    this.smartAudio.play('relaySound');
    this.vibration.vibrate(200);

    let observable: Observable<string> = this.particleService.callCloudFunction(this.relays.particleCredentials, "controlRelay", +(index + 1) + command);
    observable.subscribe
      (result => {
        this.relays.relay[index].buttonsEnabled = true;
        // command was successful
        if (result == "0") {
          this.relays.relay[index].state = command.toUpperCase();;
        }
      },
      (error) => {
        this.relays.relay[index].buttonsEnabled = true;
      });

    return observable;

  }

  pulseRelay(index: number) {

    this.gatesCancelOngoing();

    // disable buttons
    this.relays.relay[index].buttonsEnabled = false;

    // this.animationPlay(index, "pulse");
    this.smartAudio.play('relaySound');
    this.vibration.vibrate(200);

    let observable: Observable<string> = this.particleService.callCloudFunction(this.relays.particleCredentials, "controlRelay", +(index + 1) + "momentary");
    observable.subscribe
      (result => {
        this.relays.relay[index].buttonsEnabled = true;
        // command was successful
        if (result == "0") {
          this.relays.relay[index].state = "pulsing...";
        }
        // return 0;
      },
      (error) => {
        this.relays.relay[index].buttonsEnabled = true;
        // return -1;
      });

    // return 0;
    // return observable;

  }


  /*******************************************************************************
********************************************************************************
********************************************************************************
UI FUNCTIONS
these functions are used by elements in the page itself
********************************************************************************
********************************************************************************
*******************************************************************************/

  // this function tells the page the class for RELAY item background
  getStyleForBackground(index: number): string {
    if (this.relays.relay[index].state == "ON") {
      return "illuminatedBg";
    }
    return "normalBg";
  }

  // this function tells the page the class for RELAY text
  getStyleForRelayText(index: number): string {
    if (this.relays.relay[index].state == "ON") {
      return "titlesStyleOn";
    }
    return "titlesStyleOff";
  }

  // this function tells the page the class for is ON or is OFF text
  getStyleForRelayParagraph(index: number): string {
    if (this.relays.relay[index].state == "ON") {
      return "textColorOn";
    }
    return "textColorOff";
  }

  // this function tells the page the state of the relay
  getRelayState(index: number): string {

    switch (this.relays.relay[index].state) {
      case this.notAvailable:
        return this.relays.relay[index].state;
      default:
        return "is " + this.relays.relay[index].state;
    }
  }

  // this function tells the page the picture to show
  getRelayPic(index: number): string {

    // "bulbOFF" or "bulbON"
    let relayPic = "bulb" + this.relays.relay[index].state;

    // if the app could not contact the cloud yet, show the bulb is off
    if (relayPic == "bulb" + this.notAvailable) {
      relayPic = "bulbOFF";
    }
    return relayPic;
  }

  // this function tells the page what buttons can be enabled
  getRelayButtonsEnabled(index: number): boolean {
    return this.relays.relay[index].buttonsEnabled;
  }
  // this function tells the page if button on can be enabled
  getRelayButtonEnabledOn(index: number): boolean {
    return ((this.relays.relay[index].state == "OFF") && (this.relays.relay[index].buttonsEnabled));
  }
  // this function tells the page if button off can be enabled
  getRelayButtonEnabledOff(index: number): boolean {
    return ((this.relays.relay[index].state == "ON") && (this.relays.relay[index].buttonsEnabled));
  }
  // this function tells the page if button pulse can be enabled
  getRelayButtonEnabledPulse(index: number): boolean {
    return ((this.relays.relay[index].state == "OFF") && (this.relays.relay[index].buttonsEnabled));
  }


  /*******************************************************************************
********************************************************************************
********************************************************************************
ANIMATIONS FUNCTIONS
********************************************************************************
********************************************************************************
*******************************************************************************/


  // this initializes the bulb animations
  initAnims() {

    console.log("init anims");
    for (let index = 0; index < this.relays.relay.length; index++) {
      if (this.relays.relay[index].state == "ON") {
        this.relays.anims[index].goToAndStop(48, true);
      }
    }

  }

  // this initializes the bulb animations
  relayHandleAnimation(anim: any, index: number) {

    // try {
    //   if (this.relays.initDone) {
    //     return;
    //   }
    // } catch (error) {
    // }

    console.log("pushed anim ", index);
    this.relays.anims[index] = anim;
  }

  animationPlay(index: number, command: string) {

    switch (command) {
      case "on":
        this.relays.anims[index].setDirection(1);
        this.relays.anims[index].goToAndPlay(0, false);
        break;
      case "off":
        this.relays.anims[index].setDirection(-1);
        this.relays.anims[index].goToAndPlay(48, true);
        break;
      default:
        break;
    }
  }

}
