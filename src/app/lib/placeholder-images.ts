
export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = [
  {
    "id": "brand-logo",
    "description": "Futuristic 3D metallic logo with blue and orange digital circuitry highlights",
    "imageUrl": "https://images.unsplash.com/photo-1732111816779-aeec50f788ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxmdXR1cmlzdGljJTIwbG9nb3xlbnwwfHx8fDE3NzAyMTY5NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "imageHint": "futuristic logo"
  },
  {
    "id": "login-bg",
    "description": "Futuristic digital circuit board with glowing blue and orange lines representing connectivity and data",
    "imageUrl": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1080",
    "imageHint": "futuristic circuit"
  }
];
