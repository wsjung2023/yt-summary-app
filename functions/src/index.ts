/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
// 이미 addChannel 같은 export 가 있다면, 그 아래에 이어서 작성
export const ping = onRequest((req, res) => {
  logger.info("Ping called"); // ← logger 를 실제로 사용
  res.send("pong");
});
export { addChannel }      from "./addChannel";
export { fetchVideos }     from "./fetchVideos";
export { fetchVideosDaily } from "./fetchVideosDaily";  // ★ 반드시 포함

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
