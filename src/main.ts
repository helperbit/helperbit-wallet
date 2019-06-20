import * as oldapp from '../app/app';
import 'zone.js';
import { AppModule } from './app/app.module';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

platformBrowserDynamic().bootstrapModule(AppModule, []).catch(err => console.log(err));

/*
declare const require: any;
const context = require.context('../app', true, /\.ts$/);

context.keys().forEach((file: any) => {
    try {
        context(file);
    } catch (err) {
        console.log(err, file);
    }
});*/