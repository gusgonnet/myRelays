import { Injectable } from '@angular/core';
import { ParticleCredentials } from './interface.particle';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { tap } from 'rxjs/operators';


// You were looking at Angular 6 docs which includes rxjs version 6 that 
// contains throwError function. For Angular 5 (includes rxjs 5) use _throw
// https://stackoverflow.com/questions/50269239/node-modules-rxjs-rx-has-no-exported-member-throwerror
import { Observable /*, throwError*/ } from 'rxjs';
import { _throw } from 'rxjs/observable/throw';

import { catchError, retry } from 'rxjs/operators';


@Injectable()
export class ParticleService {

  private particleApi = "https://api.particle.io/v1/devices/";

  constructor(
    public httpClient: HttpClient
  ) {
  }

  private getFunctionUrl(deviceId: string, functionName: string): string {
    return this.particleApi + deviceId + "/" + functionName + "?format=raw";
  }
  private getVariableUrl(particleCredentials: ParticleCredentials, cloudVariable: string): string {
    return this.particleApi + particleCredentials.deviceId + "/" + cloudVariable + "?format=raw&access_token=" + particleCredentials.particleToken;
  }


  // The Observable returned by http.get() is of type Observable<string>
  // because a text response was specified.
  // There's no need to pass a <string> type parameter to get().
  // source: https://angular.io/guide/http
  getCloudVariable(particleCredentials: ParticleCredentials, cloudVariable: string) {

    // // is the device properly configured?
    // if (!this.checkParticleCredentials(particleCredentials)) {
    //   return -1;
    // }

    let cloudVarUrl = this.getVariableUrl(particleCredentials, cloudVariable);

    return this.httpClient.get(cloudVarUrl, { responseType: 'text' })
      .pipe(
        tap( // Log the result or error
          data => console.log('response in get variable:', data),
          error => console.error('error response in get variable:', error)
        )
      )
      .pipe(
        retry(3), // retry a failed request up to 3 times
        catchError(this.handleError) // then handle the error
      )
      .pipe(
        catchError(this.handleError)
      );
  }

  callCloudFunction(particleCredentials: ParticleCredentials, cloudFunction: string, cloudFunctionParams: string = "")
    : Observable<string> {

    // // is the device properly configured?
    // if (!this.checkParticleCredentials(particleCredentials)) {
    //   return -1;
    // }

    let cloudFunctionUrl = this.getFunctionUrl(particleCredentials.deviceId, cloudFunction);

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
        // when using this content-type below we get a CORS error in the request
        // 'Content-Type': 'application/json'
      })
    };

    let json = "access_token=" + particleCredentials.particleToken
      + "&arg=" + cloudFunctionParams;

    return this.httpClient.post<string>(cloudFunctionUrl, json, httpOptions)
      .pipe(
        tap( // Log the result or error
          data => console.log('response in call function:', data),
          error => console.error('error response in call function:', error)
        )
      )
      .pipe(
        retry(3), // retry a failed request up to 3 times
        catchError(this.handleError) // then handle the error
      )
      .pipe(
        catchError(this.handleError)
      );

  }


  checkParticleCredentials(particleCredentials: ParticleCredentials): boolean {
    if ((particleCredentials.particleToken == "") || (particleCredentials.particleToken == null) || (particleCredentials.particleToken == undefined)) {
      console.error('particleToken is not configured');
      return false;
    }
    if ((particleCredentials.deviceId == "") || (particleCredentials.deviceId == null) || (particleCredentials.deviceId == undefined)) {
      console.error('deviceId is not configured');
      return false;
    }
    return true;
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // return an observable with a user-facing error message
    // return throwError(
    return _throw(
      'Something bad happened; please try again later.');
  };

}