import { Subscription } from 'rxjs/Rx';


export interface Relay {
    state: string;
    buttonsEnabled: boolean;
}

export interface Relays {

    initDone: boolean;
    
    particleCredentials: ParticleCredentials;
    refreshOngoing: boolean;
    relay: Relay[];
  
    // timer for background refresh
    backgroundRefreshTimer;
    backgroundRefreshTimerSubscribe: Subscription;

    // this carries back the observable so the http call can be cancelled
    // source: https://stackoverflow.com/questions/36490926/how-to-cancel-a-httprequest-in-angular-2
    subscription: any;

    // lottie animations are stored here
    anims: Array<any>;

}

export interface ParticleCredentials {
    particleToken: string;
    deviceId: string;
}

// this carries back the observable so the http call can be cancelled
// source: https://stackoverflow.com/questions/36490926/how-to-cancel-a-httprequest-in-angular-2
export interface ParticleVariableReturn {
    value: string;
    observable: any;
}

// NOT SURE IF THIS ONE IS NEEDED since I only cancel variable requests
// this carries back the observable so the http call can be cancelled
// source: https://stackoverflow.com/questions/36490926/how-to-cancel-a-httprequest-in-angular-2
export interface ParticleFunctionReturn {
    value: number;
    observable: any;
}
