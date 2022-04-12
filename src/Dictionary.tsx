import { pick, WordList } from "./util";

import dictionary_hw from "./lists/dictionary.json";
import targets_hw from "./lists/targets.json";

import dictionary_nyt from "./lists/dictionary_nyt.json";
import targets_nyt from "./lists/targets_nyt.json";

const lists = {
  hw: {
    dictionary: new Set(dictionary_hw),
    targets: targets_hw.slice(0, targets_hw.indexOf("murky") + 1),
  },
  nyt: {
    dictionary: new Set(dictionary_nyt.concat(targets_nyt)),
    targets: targets_nyt,
  },
};

export default {

  checkWord: function(wl: WordList, word: string): boolean {
    return lists[wl].dictionary.has(word);
  },

  randomTarget: function(wl: WordList, wordLength: number): string {
    const eligible = lists[wl].targets.filter((word) => word.length === wordLength);
    let candidate: string;
    do {
      candidate = pick(eligible.length ? eligible : lists[wl].targets);
    } while (/\*/.test(candidate));
    return candidate;
  },

};
