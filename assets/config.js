/*
 * Project metadata overrides.
 * GitHub public repositories are loaded automatically at runtime.
 * Add / edit entries below for hand-crafted summaries, categories and priority.
 * category: tools | automation | ai | game | web | creative
 * featured: lower number is earlier in FEATURED mode.
 * Only repositories that actually exist are shown when the GitHub feed is available.
 */
window.LF_CONFIG = {
  username: 'LonzilFox',
  projects: {
    'OCRCaptureTool': {
      category: 'tools', featured: 1, tagline: 'CAPTURE. RECOGNIZE. COPY.',
      description: 'A fast desktop OCR tool for capturing on-screen text and turning pixels into editable content.',
      tags: ['OCR', 'Desktop', 'Windows']
    },
    'ScreenAssistant': {
      category: 'ai', featured: 2, tagline: 'INTELLIGENCE, IN YOUR FIELD OF VIEW.',
      description: 'An AI-driven screen assistant designed around rapid recognition and useful contextual information.',
      tags: ['AI', 'Overlay', 'OCR']
    },
    'SlimeLounge': {
      category: 'game', also: ['web'], featured: 3, tagline: 'A LITTLE DIGITAL UNIVERSE.',
      description: 'A social hangout with browser games, shared spaces and curious little systems.',
      tags: ['Multiplayer', 'Games', 'Web']
    },
    'ColorBlockClicker': {
      category: 'automation', featured: 4, tagline: 'FIND THE DIFFERENCE.',
      description: 'A compact tool for detecting color differences and automating precise screen interactions.',
      tags: ['Automation', 'Vision', 'Desktop']
    },
    'PixeloramaPixelTool': {
      category: 'creative', featured: 5, tagline: 'BUILT PIXEL BY PIXEL.',
      description: 'Creative tooling and workflow improvements for pixel-art production.',
      tags: ['Pixel Art', 'Creative', 'Tooling']
    },
    'WebsiteViewer': {
      category: 'tools', featured: 6, tagline: 'THE WEB, UNDER INSPECTION.',
      description: 'A focused utility for viewing and working with web content.',
      tags: ['Web Tools', 'Windows']
    },
    'GitHubCodeCounter': {
      category: 'tools', featured: 7, tagline: 'MEASURE THE SOURCE.',
      description: 'Analyze repositories and codebase language statistics, beyond vanity metrics.',
      tags: ['GitHub', 'Analytics', 'CLI']
    }
  }
};
