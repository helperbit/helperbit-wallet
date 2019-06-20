import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule, setAngularJSGlobal } from '@angular/upgrade/static';

 
@NgModule({
  imports: [
    BrowserModule,
    UpgradeModule
  ]
})

export class AppModule {
  constructor(private upgrade: UpgradeModule) { }
  ngDoBootstrap() {
    console.log('Bootstrapping Helperbit...');
    this.upgrade.bootstrap(document.documentElement, ['helperbit'], { strictDi: false });
  }
} 

declare var angular: angular.IAngularStatic;
setAngularJSGlobal(angular);