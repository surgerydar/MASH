#ifndef QR_H
#define QR_H

#include <QQuickImageProvider>

class Qr : public QQuickImageProvider
{
public:
    Qr();
    QImage requestImage(const QString &id, QSize *size, const QSize &requestedSize) override;
signals:

public slots:
};

#endif // QR_H
