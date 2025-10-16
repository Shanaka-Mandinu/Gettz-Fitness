import express from 'express';
import { 
  saveVideo, 
  unsaveVideo, 
  getSavedVideos, 
  checkVideoSaved,
  createPlaylist,
  addVideoToPlaylist,
  getUserPlaylists,
  getPlaylistDetails
} from '../controller/savedVideoController.js';
import verifyJWT from '../middleware/auth.js';

const router = express.Router();

// Saved Videos Routes
router.post('/save/:videoId', verifyJWT, saveVideo);
router.delete('/unsave/:videoId', verifyJWT, unsaveVideo);
router.get('/saved', verifyJWT, getSavedVideos);
router.get('/check-saved/:videoId', verifyJWT, checkVideoSaved);

// Playlist Routes
router.post('/playlist/create', verifyJWT, createPlaylist);
router.post('/playlist/:playlistId/add/:videoId', verifyJWT, addVideoToPlaylist);
router.get('/playlists', verifyJWT, getUserPlaylists);
router.get('/playlist/:playlistId', verifyJWT, getPlaylistDetails);

export default router;
