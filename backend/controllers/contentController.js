const fs = require('fs');
const path = require('path');
const contentPath = path.join(__dirname, '../data/content.json');

function readContent() {
  const raw = fs.readFileSync(contentPath, 'utf-8');
  return JSON.parse(raw);
}

function writeContent(data) {
  fs.writeFileSync(contentPath, JSON.stringify(data, null, 2), 'utf-8');
}

const getAll = (req, res) => {
  const topics = readContent();
  res.json({ topics });
};

const create = (req, res) => {
  const { title, icon, content, formula, color } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  const topics = readContent();
  const newTopic = {
    id: 'custom-' + Date.now().toString(),
    title,
    icon: icon || '📌',
    content,
    formula: formula || null,
    color: color || 'border-l-blue-700',
    isDefault: false
  };
  topics.push(newTopic);
  writeContent(topics);
  res.json({ topic: newTopic, message: 'Topic created' });
};

const update = (req, res) => {
  const { id } = req.params;
  const { title, icon, content, formula, color } = req.body;
  const topics = readContent();
  const idx = topics.findIndex(t => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Topic not found' });
  }
  if (topics[idx].isDefault) {
    return res.status(403).json({ error: 'Cannot edit default topics' });
  }
  if (title) topics[idx].title = title;
  if (icon) topics[idx].icon = icon;
  if (content) topics[idx].content = content;
  if (formula !== undefined) topics[idx].formula = formula;
  if (color) topics[idx].color = color;
  writeContent(topics);
  res.json({ topic: topics[idx], message: 'Topic updated' });
};

const remove = (req, res) => {
  const { id } = req.params;
  let topics = readContent();
  const topic = topics.find(t => t.id === id);
  if (!topic) {
    return res.status(404).json({ error: 'Topic not found' });
  }
  if (topic.isDefault) {
    return res.status(403).json({ error: 'Cannot delete default topics' });
  }
  topics = topics.filter(t => t.id !== id);
  writeContent(topics);
  res.json({ message: 'Topic deleted' });
};

module.exports = { getAll, create, update, remove };
