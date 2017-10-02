#ifndef COMPOSITEIMAGE_H
#define COMPOSITEIMAGE_H

#include <QQuickPaintedItem>
#include <QImage>
#include <QVariant>

class CompositeImage : public QQuickPaintedItem
{
    Q_OBJECT
public:
    explicit CompositeImage(QQuickItem *parent = 0);
    //
    //
    //
    void paint(QPainter *painter) override;

signals:

public slots:
    void addImage( QQuickItem *image );

private:
    void allocateImage();
    QImage m_image;
};

#endif // COMPOSITEIMAGE_H
