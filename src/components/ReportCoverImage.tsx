import { cn } from "@/lib/utils";

type ReportCoverImageProps = {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  width?: string;
  height?: string;
};

const DEFAULT_COVER_IMAGE_SRC = "/alinhamento-cover.jpg";
const DEFAULT_COVER_IMAGE_ALT = "Imagem de Alinhamento a Laser";
const DEFAULT_WIDTH = "420px";
const DEFAULT_HEIGHT = "180px";

const ReportCoverImage = ({
  src = DEFAULT_COVER_IMAGE_SRC,
  alt = DEFAULT_COVER_IMAGE_ALT,
  className,
  containerClassName,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
}: ReportCoverImageProps) => {
  return (
    <div className={cn("mb-8 flex justify-center items-center", containerClassName)}>
      <img
        src={src}
        alt={alt}
        className={cn("cover-image rounded-lg", className)}
        style={{ width, height, objectFit: "cover" }}
      />
    </div>
  );
};

export default ReportCoverImage;