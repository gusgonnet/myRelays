import { Component, ViewChild } from '@angular/core';
import { Nav, Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { SettingsPage } from '../pages/settings/settings';
import { HelpPage } from '../pages/help/help';

import { SmartAudio } from './smart-audio';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { RelaysService } from './service.relays';

import { Storage } from '@ionic/storage';
import { IntroPage } from '../pages/intro/intro';

import { LoadingController } from 'ionic-angular';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = HomePage;
  loader: any;
  pages: Array<{ title: string, component: any, icon: string }>;

  constructor(public platform: Platform,
    public statusBar: StatusBar,
    public splashScreen: SplashScreen,
    public smartAudio: SmartAudio,
    public screenOrientation: ScreenOrientation,
    public relaysService: RelaysService,
    public storage: Storage,
    public loadingCtrl: LoadingController
  ) {
    this.initializeApp();

    // used for an example of ngFor and navigation
    this.pages = [
      { title: 'Relays', component: HomePage, icon: "ios-home-outline" },
      { title: 'Settings', component: SettingsPage, icon: "ios-settings-outline" },
      { title: 'App info', component: HelpPage, icon: "ios-information-circle-outline" }
    ];

  }

  initializeApp() {

    this.presentLoading();

    this.platform.ready().then(() => {

      this.storage.get('introShown').then((result) => {

        // DEBUGGING -> show intro all the time!
        // result = false;

        if (result) {
          this.rootPage = HomePage;
        } else {
          this.rootPage = IntroPage;
          this.storage.set('introShown', true);
        }

        this.loader.dismiss();

      });

      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      this.smartAudio.preload('relaySound', 'assets/audio/click.mp3');

      // lock orientation to portrait since we want it that way
      // only on a phone, not on a browser
      if (this.platform.is('cordova')) {
        this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
      }

      // this.relaysService.initRelays();

    });
  }

  presentLoading() {

    this.loader = this.loadingCtrl.create({
      content: "Authenticating..."
    });

    // this.loader.present();

  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(page.component);
  }
}
