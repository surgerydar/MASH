#include "qr.h"
#include "libqrencode/qrencode.h"
#include <QMap>
#include <QScreen>
#include <QGuiApplication>
#include <QPainter>
#include <QDebug>
const QMap<int,qreal> k_minimumSize = {
    { 26, 1.8 },
    { 49, 2.1 },
    { 72, 2.5 },
    { 98, 2.9 },
    { 125, 3.2 },
    { 163, 3.6 },
    { 203, 3.9 },
    { 249, 4.3 },
    { 298, 4.7 },
    { 351, 5.0 },
    { 407, 5.4 },
    { 468, 5.7 },
    { 534, 6.1 },
    { 601, 6.4 },
    { 669, 6.8 },
    { 739, 7.2 }
};

qreal minimumSize( int nChars ) {
    for ( auto key : k_minimumSize.keys() ) {

        if ( key >= nChars ) {
            return k_minimumSize.value(key);
        }
    }
    return 7.2;
}

Qr::Qr() : QQuickImageProvider(QQuickImageProvider::Image) {

}

QImage Qr::requestImage(const QString &id, QSize *size, const QSize &requestedSize) {
    //
    //
    //
    qDebug() << "Qr::requestImage : encoding : " << id;
    QRcode *qr = QRcode_encodeString(id.toStdString().c_str(), 0, QR_ECLEVEL_L, QR_MODE_8, 1);
    QImage image;
    if ( qr ) {
        qDebug() << "Qr::requestImage : encoded width : " << qr->width;
        //
        // calculate optimum size
        //
        qreal dpi = QGuiApplication::screens()[ 0 ]->physicalDotsPerInch();
        int minimumDimension = (int) minimumSize( id.length() ) * dpi;
        qDebug() << "Qr::requestImage : generating image min size : " << minimumDimension;
        //
        // set size
        //
        QSize imageSize;
        if ( requestedSize.isValid() ) {
            int requestedDim = std::max<int>( requestedSize.width(), requestedSize.height() );
            imageSize.setWidth(std::max<int>(minimumDimension,requestedDim));
            imageSize.setHeight(std::max<int>(minimumDimension,requestedDim));
        } else {
            imageSize.setWidth(minimumDimension);
            imageSize.setHeight(minimumDimension);
        }
        if ( size ) *size = QSize(imageSize.width(), imageSize.height());
        //
        //
        //
        image = QImage(imageSize,QImage::Format_ARGB32_Premultiplied);
        //
        //
        //
        QPainter painter(&image);
        painter.fillRect(0,0,image.width(),image.height(),Qt::white);
        const int s=qr->width>0?qr->width:1;
        const double w=image.width();
        const double h=image.height();
        const double scale=w/(s+2);
        for(int y=0;y<s;y++){
            const int yy=y*s;
            for(int x=0;x<s;x++){
                const int xx=yy+x;
                const unsigned char b=qr->data[xx];
                if(b&0x01){
                    const double rx1=(x+1)*scale, ry1=(y+1)*scale;
                    QRectF r(rx1, ry1, scale, scale);
                    painter.fillRect(r,Qt::black);
                }
            }
        }
        QRcode_free(qr);
    } else {
        qDebug() << "Qr::requestImage : unable to encode : ";
    }
    return image;
}
