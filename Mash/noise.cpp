#include "noise.h"

Noise::Noise() : QQuickImageProvider(QQuickImageProvider::Image) {

}

QImage Noise::requestImage(const QString &id, QSize *size, const QSize &requestedSize) {
    int width = requestedSize.width() > 0 ? requestedSize.width() : 256;
    int height = requestedSize.height() > 0 ? requestedSize.height() : 256;
    if ( size ) *size = QSize(width, height);
    QImage image(width,height,QImage::Format_ARGB32_Premultiplied);
    for ( int x = 0;  x < size->width(); ++x ) {
        for ( int y = 0; y < size->height(); ++y ) {
            /*
            float intensity = random() % 255;
            QColor colour(intensity,intensity,intensity);
            */
            QColor colour(random() % 255,random() % 255,random() % 255);
            image.setPixelColor(x,y,colour);
        }
    }
    return image;
}
