import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { SettingsPage } from '../pages/settings/settings';
import { HelpPage } from '../pages/help/help';
import { IntroPage } from '../pages/intro/intro';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { IonicStorageModule } from '@ionic/storage';

// old
import { HttpModule } from '@angular/http';

// new
import { HttpClientModule } from '@angular/common/http';
import { RelaysService } from './service.relays';
import { ParticleService } from './service.particle';
import { StorageService } from './service.storage';

import { NativeAudio } from '@ionic-native/native-audio';
import { SmartAudio } from './smart-audio';
import { Vibration } from '@ionic-native/vibration';
import { LottieAnimationViewModule } from 'ng-lottie';
import { ScreenOrientation } from '@ionic-native/screen-orientation';


@NgModule({
  declarations: [
    MyApp,
    HomePage,
    SettingsPage,
    HelpPage,
    IntroPage
  ],
  imports: [
    LottieAnimationViewModule,
    BrowserModule,
    IonicModule.forRoot(MyApp),
    HttpModule,
    HttpClientModule,
    IonicStorageModule.forRoot()    
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    SettingsPage,
    HelpPage,
    IntroPage
  ],
  providers: [
    RelaysService,
    StorageService,
    ParticleService,
    SplashScreen,
    StatusBar,
    NativeAudio,
    SmartAudio,
    Vibration,
    ScreenOrientation,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
