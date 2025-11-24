/**
 * @title src/components/LogisticsMap.tsx
 * @collapsible
 */
import React from "react";
import { Order, Driver } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon, DivIcon, Point } from "leaflet";
import { Truck, MapPin, Package, Clock } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton"; // Importação adicionada para uso

interface LogisticsMapProps {
    orders: Order[];
    drivers: Driver[];
    isLoading: boolean;
}

// Coordenadas de exemplo (São Paulo como fallback)
const DEFAULT_CENTER: [number, number] = [-23.55052, -46.633309];

// =======================================================
// CONFIGURAÇÃO DE ÍCONES PERSONALIZADOS (Leaflet)
// =======================================================

// Ícone para Entregadores (Truck)
const driverIcon = new DivIcon({
    html: `
        <div class="p-2 bg-green-600 text-white rounded-full flex items-center shadow-xl border-2 border-white">
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4">
                <path d="M496 160h-64V96a32 32 0 0 0-32-32H32A32 32 0 0 0 0 96v256a32 32 0 0 0 32 32h64v80c0 17.67 14.33 32 32 32h256c17.67 0 32-14.33 32-32v-80h64c17.67 0 32-14.33 32-32V192a32 32 0 0 0-32-32zM128 448H96v-64h32v64zm256 0h-64v-64h64v64zm64-128h-64V96h64v224zM320 320h-64v-64h64v64zM224 320h-64v-64h64v64zM128 320H96v-64h32v64z"></path>
            </svg>
        </div>
    `,
    iconSize: new Point(36, 36),
    className: "",
});

// Ícone para Locais de Entrega (Package)
const orderIcon = new DivIcon({
    html: `
        <div class="p-2 bg-amber-500 text-white rounded-full flex items-center shadow-xl border-2 border-white">
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4">
                <path d="M20 7H4c-1.103 0-2 .897-2 2v2h18V9c0-1.103-.897-2-2-2zM2 17h6v2H4c-1.103 0-2-.897-2-2v-2zm16 0h4v-2h-4v2zM16 11v-2h-4v2h4zM16 13h-4v-2h4v2zM10 13v-2H4v2h6zM18 13h4v-2h-4v2zM20 5H4c-2.206 0-4 1.794-4 4v8c0 2.206 1.794 4 4 4h16c2.206 0 4-1.794 4-4v-8c0-2.206-1.794-4-4-4z"></path>
            </svg>
        </div>
    `,
    iconSize: new Point(36, 36),
    className: "",
});

// =======================================================
// COMPONENTE PRINCIPAL
// =======================================================

const LogisticsMap: React.FC<LogisticsMapProps> = ({
    orders,
    drivers,
    isLoading,
}) => {
    // CORREÇÃO DO LINTER (Adiciona defaultPosition ao array de dependências)
    const centerPosition: [number, number] = React.useMemo(() => {
        const activeDrivers = drivers.filter((d) => d.latitude && d.longitude);
        if (activeDrivers.length === 0) return DEFAULT_CENTER;

        const avgLat =
            activeDrivers.reduce((sum, d) => sum + (d.latitude || 0), 0) /
            activeDrivers.length;
        const avgLng =
            activeDrivers.reduce((sum, d) => sum + (d.longitude || 0), 0) /
            activeDrivers.length;

        return [avgLat, avgLng];
    }, [drivers, DEFAULT_CENTER]); // CORRIGIDO: Adicionado DEFAULT_CENTER

    if (isLoading) {
        return (
            <CardContent className="h-[600px] flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <Skeleton className="h-[600px] w-full" />
            </CardContent>
        );
    }

    return (
        <Card className="shadow-lg">
            <CardContent className="p-0">
                <div
                    className="relative z-0"
                    style={{ height: "600px", width: "100%" }}
                >
                    <MapContainer
                        center={centerPosition}
                        zoom={12}
                        scrollWheelZoom={true}
                        style={{ height: "100%", width: "100%" }}
                        className="rounded-lg"
                    >
                        {/* Camada base do mapa (OpenStreetMap) */}
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Marcadores de Entregadores */}
                        {drivers.map(
                            (driver) =>
                                driver.latitude &&
                                driver.longitude && (
                                    <Marker
                                        key={driver.id}
                                        position={[
                                            driver.latitude,
                                            driver.longitude,
                                        ]}
                                        icon={driverIcon}
                                    >
                                        <Popup>
                                            <div className="font-semibold text-sm">
                                                Entregador: {driver.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center mt-1">
                                                <Truck className="h-3 w-3 mr-1" />{" "}
                                                Em Rota:{" "}
                                                {
                                                    orders.filter(
                                                        (o) =>
                                                            o.driver_id ===
                                                            driver.id
                                                    ).length
                                                }{" "}
                                                pedidos
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center">
                                                <Clock className="h-3 w-3 mr-1" />
                                                Última atualização:{" "}
                                                {driver.last_updated
                                                    ? formatDistanceToNow(
                                                          parseISO(
                                                              driver.last_updated
                                                          ),
                                                          {
                                                              addSuffix: true,
                                                              locale: ptBR,
                                                          }
                                                      )
                                                    : "N/A"}
                                            </div>
                                        </Popup>
                                    </Marker>
                                )
                        )}

                        {/* Marcadores de Pedidos (Destino) */}
                        {orders
                            .filter((o) => o.Addresses)
                            .map((order) => {
                                const { street, number, city } =
                                    order.Addresses!;

                                // SIMULAÇÃO: Usando a posição padrão com offset, pois o Geocoding
                                // (converter endereço em Lat/Lng) é um serviço externo não implementado.
                                const orderLat =
                                    DEFAULT_CENTER[0] +
                                    (Math.random() - 0.5) * 0.05;
                                const orderLng =
                                    DEFAULT_CENTER[1] +
                                    (Math.random() - 0.5) * 0.05;

                                return (
                                    <Marker
                                        key={order.id}
                                        position={[orderLat, orderLng]}
                                        icon={orderIcon}
                                    >
                                        <Popup>
                                            <div className="font-bold text-sm">
                                                Entrega: Pedido #
                                                {order.id.substring(0, 8)}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Cliente: {order.Clients?.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Endereço: {street}, {number} (
                                                {city})
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}
                    </MapContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export { LogisticsMap };
