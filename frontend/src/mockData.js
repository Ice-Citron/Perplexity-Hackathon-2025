export const mockStory = {
  id: 'story-1',
  headline: 'Tech Giant Announces Major AI Breakthrough',
  entities: ['TechCorp', 'AI', 'Silicon Valley', 'CEO Sarah Chen'],
  timestamp: new Date().toISOString(),
  sources: [
    { domain: 'nytimes.com', region: 'US', leaning: 'center-left' },
    { domain: 'wsj.com', region: 'US', leaning: 'center-right' },
    { domain: 'bbc.com', region: 'UK', leaning: 'center' },
    { domain: 'reuters.com', region: 'Global', leaning: 'center' },
    { domain: 'techcrunch.com', region: 'US', leaning: 'tech' },
    { domain: 'theguardian.com', region: 'UK', leaning: 'left' }
  ],
  claims: [
    {
      id: 'claim-1',
      category: 'consensus',
      text: 'TechCorp announced a new AI model with 500 billion parameters',
      entities: ['TechCorp', 'AI model'],
      numbers: [{ value: 500000000000, unit: 'parameters' }],
      framing: { hedges: [], modality: ['announced'], loaded_terms: [] },
      stances: [
        { outlet: 'nytimes.com', stance: 'supports', quote: 'TechCorp unveiled its latest AI model featuring 500 billion parameters...', url: 'https://nytimes.com/article1', confidence: 0.95 },
        { outlet: 'wsj.com', stance: 'supports', quote: 'The company confirmed the model contains 500 billion parameters...', url: 'https://wsj.com/article1', confidence: 0.92 },
        { outlet: 'bbc.com', stance: 'supports', quote: 'TechCorp\'s new system has 500 billion parameters...', url: 'https://bbc.com/article1', confidence: 0.90 },
        { outlet: 'reuters.com', stance: 'supports', quote: 'Sources confirm 500 billion parameter count...', url: 'https://reuters.com/article1', confidence: 0.88 },
        { outlet: 'techcrunch.com', stance: 'supports', quote: '500B parameters make this the largest model yet...', url: 'https://techcrunch.com/article1', confidence: 0.93 },
        { outlet: 'theguardian.com', stance: 'supports', quote: 'The AI breakthrough features 500 billion parameters...', url: 'https://theguardian.com/article1', confidence: 0.89 }
      ]
    },
    {
      id: 'claim-2',
      category: 'consensus',
      text: 'CEO Sarah Chen led the announcement at company headquarters',
      entities: ['CEO Sarah Chen', 'headquarters'],
      numbers: [],
      framing: { hedges: [], modality: ['led'], loaded_terms: [] },
      stances: [
        { outlet: 'nytimes.com', stance: 'supports', quote: 'CEO Sarah Chen presented the breakthrough from headquarters...', url: 'https://nytimes.com/article1', confidence: 0.91 },
        { outlet: 'wsj.com', stance: 'supports', quote: 'Chen announced the news in a keynote speech...', url: 'https://wsj.com/article1', confidence: 0.89 },
        { outlet: 'bbc.com', stance: 'supports', quote: 'Sarah Chen, TechCorp CEO, revealed the model...', url: 'https://bbc.com/article1', confidence: 0.87 },
        { outlet: 'reuters.com', stance: 'neutral', quote: 'The announcement was made at headquarters...', url: 'https://reuters.com/article1', confidence: 0.60 },
        { outlet: 'techcrunch.com', stance: 'supports', quote: 'Chen delivered the news to packed press conference...', url: 'https://techcrunch.com/article1', confidence: 0.90 },
        { outlet: 'theguardian.com', stance: 'supports', quote: 'TechCorp\'s CEO Sarah Chen announced...', url: 'https://theguardian.com/article1', confidence: 0.85 }
      ]
    },
    {
      id: 'claim-3',
      category: 'disputed',
      text: 'The model will be available to consumers by end of 2025',
      entities: ['consumers', '2025'],
      numbers: [{ value: 2025, unit: 'year' }],
      framing: { hedges: ['will'], modality: ['expected', 'plans'], loaded_terms: [] },
      stances: [
        { outlet: 'nytimes.com', stance: 'supports', quote: 'TechCorp plans consumer release by December 2025...', url: 'https://nytimes.com/article1', confidence: 0.75 },
        { outlet: 'wsj.com', stance: 'refutes', quote: 'No consumer timeline was provided in the announcement...', url: 'https://wsj.com/article1', confidence: 0.82 },
        { outlet: 'bbc.com', stance: 'neutral', quote: 'The company mentioned potential consumer applications...', url: 'https://bbc.com/article1', confidence: 0.55 },
        { outlet: 'reuters.com', stance: 'refutes', quote: 'Chen declined to commit to a consumer launch date...', url: 'https://reuters.com/article1', confidence: 0.80 },
        { outlet: 'techcrunch.com', stance: 'supports', quote: 'Sources say late 2025 consumer rollout is planned...', url: 'https://techcrunch.com/article1', confidence: 0.68 },
        { outlet: 'theguardian.com', stance: 'neutral', quote: 'Timeline for public access remains unclear...', url: 'https://theguardian.com/article1', confidence: 0.62 }
      ]
    },
    {
      id: 'claim-4',
      category: 'disputed',
      text: 'The development cost exceeded $10 billion',
      entities: ['development cost'],
      numbers: [{ value: 10000000000, unit: 'USD' }],
      framing: { hedges: ['allegedly', 'reportedly'], modality: ['estimated'], loaded_terms: [] },
      stances: [
        { outlet: 'nytimes.com', stance: 'supports', quote: 'Sources estimate development costs surpassed $10 billion...', url: 'https://nytimes.com/article1', confidence: 0.70 },
        { outlet: 'wsj.com', stance: 'supports', quote: 'Industry analysts peg investment at over $10B...', url: 'https://wsj.com/article1', confidence: 0.72 },
        { outlet: 'bbc.com', stance: 'neutral', quote: 'TechCorp did not disclose development costs...', url: 'https://bbc.com/article1', confidence: 0.50 },
        { outlet: 'reuters.com', stance: 'refutes', quote: 'Company spokesperson denied $10B figure as speculative...', url: 'https://reuters.com/article1', confidence: 0.78 },
        { outlet: 'techcrunch.com', stance: 'supports', quote: 'Unnamed sources claim $10+ billion spent...', url: 'https://techcrunch.com/article1', confidence: 0.65 },
        { outlet: 'theguardian.com', stance: 'neutral', quote: 'Costs remain undisclosed, though likely in billions...', url: 'https://theguardian.com/article1', confidence: 0.58 }
      ]
    },
    {
      id: 'claim-5',
      category: 'missing',
      text: 'The AI model will be used for military applications',
      entities: ['military applications'],
      numbers: [],
      framing: { hedges: ['allegedly'], modality: ['could'], loaded_terms: ['military'] },
      stances: [
        { outlet: 'nytimes.com', stance: 'not_mentioned', quote: '', url: '', confidence: 0 },
        { outlet: 'wsj.com', stance: 'not_mentioned', quote: '', url: '', confidence: 0 },
        { outlet: 'bbc.com', stance: 'not_mentioned', quote: '', url: '', confidence: 0 },
        { outlet: 'reuters.com', stance: 'not_mentioned', quote: '', url: '', confidence: 0 },
        { outlet: 'techcrunch.com', stance: 'neutral', quote: 'Questions raised about potential defense contracts...', url: 'https://techcrunch.com/article1', confidence: 0.45 },
        { outlet: 'theguardian.com', stance: 'supports', quote: 'Critics warn of possible military use cases...', url: 'https://theguardian.com/article1', confidence: 0.55 }
      ]
    },
    {
      id: 'claim-6',
      category: 'missing',
      text: 'Former employees raised concerns about safety testing',
      entities: ['employees', 'safety testing'],
      numbers: [],
      framing: { hedges: ['allegedly'], modality: ['raised'], loaded_terms: ['concerns'] },
      stances: [
        { outlet: 'nytimes.com', stance: 'not_mentioned', quote: '', url: '', confidence: 0 },
        { outlet: 'wsj.com', stance: 'not_mentioned', quote: '', url: '', confidence: 0 },
        { outlet: 'bbc.com', stance: 'not_mentioned', quote: '', url: '', confidence: 0 },
        { outlet: 'reuters.com', stance: 'not_mentioned', quote: '', url: '', confidence: 0 },
        { outlet: 'techcrunch.com', stance: 'not_mentioned', quote: '', url: '', confidence: 0 },
        { outlet: 'theguardian.com', stance: 'supports', quote: 'Anonymous former staff question adequacy of safety protocols...', url: 'https://theguardian.com/article1', confidence: 0.68 }
      ]
    }
  ]
};
