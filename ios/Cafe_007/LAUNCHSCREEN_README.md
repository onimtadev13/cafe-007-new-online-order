# Update iOS Launch Screen Image

This project updated `LaunchScreen.storyboard` to include an ImageView referencing an asset named `launch_screen`.

Steps to make the image appear on launch screen:

1. Open `ios/Cafe_007/Images.xcassets` in Xcode.
2. Locate `LaunchScreen.imageset` (created by this change).
3. Drag and drop the image file(s) you want to use (e.g. `launch_screen.png`) into the imageset slots (1x, 2x, 3x) using Xcode's asset editor.
   - The project's `assets` folder includes `launch_screen.png` and `launch_screen.jpg`. You can use one of those images as the asset.
4. If you prefer to use a different image name, change the `image` attribute in `LaunchScreen.storyboard` to match the asset name.
5. Build the iOS project in Xcode and run the app. The image should appear centered on the launch screen.

Note: If you want the image to scale differently, edit the `imageView` attributes in `LaunchScreen.storyboard` using Xcode Interface Builder and update constraints accordingly.
