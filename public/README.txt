Place any raw static assets in this "public" folder that you want to reference at the root URL of your website.

For example:
- To use your own background loop video:
  Upload your MP4 video and name it "bg_video.mp4" right here in this folder.
  It will automatically be picked up by the CARDEX portal.

- To use local images for the background slots instead of online links:
  Upload your picture files (e.g., "supra.jpg", "porsche.jpg") in this folder,
  and change the "imageUrl" inside "/src/components/PixelSupercarsBackground.tsx" to match their name (e.g. "supra.jpg").
