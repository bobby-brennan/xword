import { Injectable }     from '@angular/core';
import { Http, Response, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/toPromise';

declare let window: any;

const DICT_URL = 'clues_filtered.json';
const MAX_WORD_LENGTH = 20
const MIN_BIGRAM_COUNT = 50;

@Injectable()
export class DictionaryService {
  clues: any;
  words: any[];
  byLength: any[][];
  bigrams: any;

  constructor(private http: Http) {
    this.byLength = [];
    for (var l = 1; l <= MAX_WORD_LENGTH; ++l) {
      this.byLength.push([]);
    }
  }

  contains(s: string) {
    return this.getPrompt(s) ? true : false;
  }

  getPrompt(s: string) {
    return this.clues[s.toUpperCase()];
  }

  getData() {
    return this.http.get(DICT_URL)
      .toPromise()
      .then(data => {
        this.clues = data.json();
        this.words = Object.keys(this.clues)
            .filter(s => s.length <= MAX_WORD_LENGTH)
            .map((s, idx) => ({word: s.toLowerCase(), frequency: idx}));
        this.bigrams = {};
        this.words.forEach(w => {
          var arr = this.byLength[w.word.length - 1];
          arr.push(w);
          for (var i = 0; i < w.word.length - 1; ++i) {
            var bigram = w.word.substring(i, i + 2);
            this.bigrams[bigram] = this.bigrams[bigram] || 0;
            this.bigrams[bigram]++;
          }
        })
        for (var bigram in this.bigrams) {
          if (this.bigrams[bigram] < MIN_BIGRAM_COUNT) delete this.bigrams[bigram];
        }
        return this.byLength;
      })
      .catch(this.handleError);
  }

  private handleError (error: any) {
    let errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg);
    return Promise.reject(errMsg);
  }
}
