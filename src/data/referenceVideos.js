// Reference video library — real tennis footage from Mixkit (free, no watermark)
// License: Mixkit License (free for commercial use)

export const referenceVideos = [
  // === SERVE ===
  {
    id: 'serve-technique',
    title: 'Tennis Player Serving',
    category: 'Serve',
    level: 'Pro',
    description: 'Classic serve motion with trophy position and contact',
    videoUrl: '/videos/serve-technique.mp4',
    duration: '0:10',
  },
  {
    id: 'serve-man',
    title: 'Man Serving Tennis Ball',
    category: 'Serve',
    level: 'Pro',
    description: 'Full serve motion — toss, coil, and pronation',
    videoUrl: '/videos/serve-man.mp4',
    duration: '0:12',
  },
  {
    id: 'serve-aerial',
    title: 'Serve — Aerial View',
    category: 'Serve',
    level: 'Pro',
    description: 'Serve technique from overhead drone angle',
    videoUrl: '/videos/serve-aerial.mp4',
    duration: '0:10',
  },
  {
    id: 'serve-bounce',
    title: 'Bounce Before Serve',
    category: 'Serve',
    level: 'Pro',
    description: 'Pre-serve ritual and ball bounce, then serve motion',
    videoUrl: '/videos/serve-bounce.mp4',
    duration: '0:18',
  },
  {
    id: 'serve-action',
    title: 'Serve in Action',
    category: 'Serve',
    level: 'Intermediate',
    description: 'Dynamic serve from behind the baseline',
    videoUrl: '/videos/serve-action.mp4',
    duration: '0:14',
  },

  // === FOREHAND ===
  {
    id: 'forehand-match',
    title: 'Forehand in Match',
    category: 'Forehand',
    level: 'Pro',
    description: 'Forehand groundstroke during competitive play',
    videoUrl: '/videos/forehand-match.mp4',
    duration: '0:13',
  },
  {
    id: 'forehand-hit',
    title: 'Forehand Strike',
    category: 'Forehand',
    level: 'Pro',
    description: 'Close-up of forehand contact and follow-through',
    videoUrl: '/videos/forehand-hit.mp4',
    duration: '0:19',
  },
  {
    id: 'man-playing',
    title: 'Man Playing Tennis',
    category: 'Forehand',
    level: 'Intermediate',
    description: 'Full court movement with forehand drives',
    videoUrl: '/videos/man-playing.mp4',
    duration: '0:15',
  },

  // === VOLLEY ===
  {
    id: 'rally-pair',
    title: 'Rally — Two Players',
    category: 'Volley',
    level: 'Pro',
    description: 'Aerial view of two players rallying at net',
    videoUrl: '/videos/rally-pair.mp4',
    duration: '0:18',
  },
  {
    id: 'serve-rally',
    title: 'Players at Outdoor Court',
    category: 'Volley',
    level: 'Pro',
    description: 'Full-court rally with approach and net play',
    videoUrl: '/videos/serve-rally.mp4',
    duration: '0:20',
  },

  // === BACKHAND ===
  {
    id: 'ball-net',
    title: 'Ball Over the Net',
    category: 'Backhand',
    level: 'Intermediate',
    description: 'Cross-court shot — observe footwork and hip turn',
    videoUrl: '/videos/ball-net.mp4',
    duration: '0:09',
  },
  {
    id: 'court-aerial',
    title: 'Court Overview — Aerial',
    category: 'Backhand',
    level: 'Intermediate',
    description: 'Full court movement — study positioning',
    videoUrl: '/videos/court-aerial.mp4',
    duration: '0:11',
  },
]

export const categories = ['All', 'Serve', 'Forehand', 'Backhand', 'Volley']
