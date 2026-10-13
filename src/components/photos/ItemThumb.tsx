import { PhotoView } from './PhotoView';

/** Small circular item photo (or plate placeholder, PHOTO-5) for list rows. */
export function ItemThumb({ photoId, size = 36 }: { photoId: string | undefined; size?: number }) {
  return (
    <span
      className="block shrink-0 overflow-hidden rounded-full bg-porcelain p-[2px] ring-1 ring-[#E4DACA]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span className="block h-full w-full overflow-hidden rounded-full">
        <PhotoView photoId={photoId} size={size - 4} />
      </span>
    </span>
  );
}
