import { Injectable, OnInit } from '@angular/core';
import { Http, Response, Headers, URLSearchParams, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable()
export class EvaluationService {
    
    url: string;

   constructor(public http: HttpClient) {
       this.url = `${environment.apiUrl}/evaluations`;
    }

   save(evaluation) {
        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type':  'application/json'
            })
        };
      return this.http.post(this.url, evaluation);
    }

    // update(audit) {
    //     const httpOptions = {
    //         headers: new HttpHeaders({
    //             'Content-Type':  'application/json'
    //         })
    //     };
    //   return this.http.put(`${this.url}/${audit.id}`, audit, httpOptions);
    // }

    // load(): Observable<any> {
    //     return this.http.get(this.url).map((response: Response) => {
    //         return response;
    //     });
    // }

    // remove(id) {
    //    return this.http.delete(`${this.url}/${id}`);
    // }
}
