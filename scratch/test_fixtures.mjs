import { SourceToTranslationConsistencyCheck } from '../src/services/source_to_translation_consistency_check.ts';

export const PROBLEM_PARAGRAPH = "Yesterday, I went to college by bus because my bike was not working. After reaching college, I attended my classes and had lunch with my friends. The afternoon class was very boring, so I felt sleepy. After college, I wanted to go to the railway station, but I did not know the correct route. I asked a local person for directions, and he helped me find the station. Before returning home, I bought some drinking water from a nearby shop.";

export const SEMANTIC_TEST_CASES = [
  {
    category: 'Negation',
    sentence: "I do not want to go there.",
    expectedMeaning: 'Must convey refusal/unwillingness to go'
  },
  {
    category: 'Time',
    sentence: "My train leaves at 5:30 PM.",
    expectedMeaning: 'Must preserve 5:30 PM and departure'
  },
  {
    category: 'Cause',
    sentence: "I took an umbrella because it was raining.",
    expectedMeaning: 'Must preserve umbrella, rain, and causal reason'
  },
  {
    category: 'Contrast',
    sentence: "The hotel is cheap, but it is far from the station.",
    expectedMeaning: 'Must contrast low cost with far distance'
  },
  {
    category: 'Requests',
    sentence: "Please help me find the nearest hospital.",
    expectedMeaning: 'Must convey polite request for hospital direction'
  },
  {
    category: 'Similar Concepts (Boring vs Difficult)',
    sentence: "The class was boring, but the examination was difficult.",
    expectedMeaning: 'Must distinguish boring (uninteresting) from difficult (hard/challenging)'
  },
  {
    category: 'Names and Places',
    sentence: "Gowtham is travelling to Chennai tomorrow.",
    expectedMeaning: 'Must preserve person Gowtham and destination Chennai'
  }
];
