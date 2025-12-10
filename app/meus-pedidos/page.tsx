"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
	Package,
	Clock,
	CheckCircle2,
	Truck,
	XCircle,
	ShoppingBag,
	ArrowRight,
	Calendar,
	MapPin,
	Globe,
	Eye,
} from "lucide-react";
import { getOrders } from "@/lib/api-client";

interface OrderItem {
	id: string;
	orderId: string;
	productId: string;
	quantity: number;
	unitPrice: number;
	photocardName: string | null;
	photocardIdol: string | null;
	photocardGroup: string | null;
	photocardImageUrl: string | null;
}

interface Order {
	id: string;
	userId: string;
	groupPurchaseId: string;
	productId: string | null;
	quantity: number;
	unitPrice: number;
	status: string;
	totalAmount: number;
	contactInfo: Record<string, any> | null;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
	groupPurchaseTitle: string | null;
	groupPurchaseStatus: string | null;
	groupPurchaseType: string | null;
	items: OrderItem[];
}

const statusConfig: Record<
	string,
	{ label: string; color: string; icon: React.ReactNode; bgColor: string }
> = {
	pending: {
		label: "Pendente",
		color: "text-yellow-700",
		bgColor: "bg-yellow-50 border-yellow-200",
		icon: <Clock className="w-4 h-4" />,
	},
	confirmed: {
		label: "Confirmado",
		color: "text-blue-700",
		bgColor: "bg-blue-50 border-blue-200",
		icon: <CheckCircle2 className="w-4 h-4" />,
	},
	paid: {
		label: "Pago",
		color: "text-green-700",
		bgColor: "bg-green-50 border-green-200",
		icon: <CheckCircle2 className="w-4 h-4" />,
	},
	shipped: {
		label: "Enviado",
		color: "text-purple-700",
		bgColor: "bg-purple-50 border-purple-200",
		icon: <Truck className="w-4 h-4" />,
	},
	delivered: {
		label: "Entregue",
		color: "text-emerald-700",
		bgColor: "bg-emerald-50 border-emerald-200",
		icon: <Package className="w-4 h-4" />,
	},
	canceled: {
		label: "Cancelado",
		color: "text-red-700",
		bgColor: "bg-red-50 border-red-200",
		icon: <XCircle className="w-4 h-4" />,
	},
};

export default function MeusPedidosPage() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
	const [showDetailsDialog, setShowDetailsDialog] = useState(false);
	const [activeTab, setActiveTab] = useState("all");

	useEffect(() => {
		loadOrders();
	}, []);

	const loadOrders = async () => {
		try {
			setIsLoading(true);
			const data = await getOrders();
			setOrders(data as unknown as Order[]);
		} catch (error) {
			console.error("Error loading orders:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const filteredOrders = orders.filter((order) => {
		if (activeTab === "all") return true;
		if (activeTab === "active")
			return ["pending", "confirmed", "paid", "shipped"].includes(order.status);
		if (activeTab === "completed") return order.status === "delivered";
		if (activeTab === "canceled") return order.status === "canceled";
		return true;
	});

	const stats = {
		total: orders.length,
		active: orders.filter((o) =>
			["pending", "confirmed", "paid", "shipped"].includes(o.status)
		).length,
		completed: orders.filter((o) => o.status === "delivered").length,
		totalSpent: orders
			.filter((o) => o.status !== "canceled")
			.reduce((acc, o) => acc + o.totalAmount, 0),
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("pt-BR", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	};

	const getStatusInfo = (status: string) => {
		return (
			statusConfig[status] || {
				label: status,
				color: "text-gray-700",
				bgColor: "bg-gray-50 border-gray-200",
				icon: <Package className="w-4 h-4" />,
			}
		);
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Navbar />
				<div className="container mx-auto px-4 py-8">
					<Skeleton className="h-10 w-48 mb-6" />
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
						{[1, 2, 3, 4].map((i) => (
							<Skeleton key={i} className="h-24 rounded-lg" />
						))}
					</div>
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-40 rounded-lg" />
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />

			<div className="container mx-auto px-4 py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold mb-2">Meus Pedidos</h1>
					<p className="text-muted-foreground">
						Acompanhe todos os seus pedidos em CEGs
					</p>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
					<Card className="border-0 shadow-sm">
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-pink-100 rounded-lg">
									<ShoppingBag className="w-5 h-5 text-pink-600" />
								</div>
								<div>
									<p className="text-2xl font-bold">{stats.total}</p>
									<p className="text-xs text-muted-foreground">
										Total de Pedidos
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-0 shadow-sm">
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-blue-100 rounded-lg">
									<Clock className="w-5 h-5 text-blue-600" />
								</div>
								<div>
									<p className="text-2xl font-bold">{stats.active}</p>
									<p className="text-xs text-muted-foreground">Em Andamento</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-0 shadow-sm">
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-green-100 rounded-lg">
									<CheckCircle2 className="w-5 h-5 text-green-600" />
								</div>
								<div>
									<p className="text-2xl font-bold">{stats.completed}</p>
									<p className="text-xs text-muted-foreground">Entregues</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-0 shadow-sm">
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-purple-100 rounded-lg">
									<Package className="w-5 h-5 text-purple-600" />
								</div>
								<div>
									<p className="text-2xl font-bold text-pink-600">
										R$ {stats.totalSpent.toFixed(2)}
									</p>
									<p className="text-xs text-muted-foreground">Total Gasto</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Tabs and Orders List */}
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="mb-6">
						<TabsTrigger value="all">Todos ({orders.length})</TabsTrigger>
						<TabsTrigger value="active">
							Em Andamento ({stats.active})
						</TabsTrigger>
						<TabsTrigger value="completed">
							Entregues ({stats.completed})
						</TabsTrigger>
						<TabsTrigger value="canceled">
							Cancelados ({orders.filter((o) => o.status === "canceled").length}
							)
						</TabsTrigger>
					</TabsList>

					<TabsContent value={activeTab} className="space-y-4">
						{filteredOrders.length === 0 ? (
							<Card className="border-0 shadow-sm">
								<CardContent className="py-12 text-center">
									<ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
									<h3 className="text-lg font-semibold mb-2">
										Nenhum pedido encontrado
									</h3>
									<p className="text-muted-foreground mb-4">
										{activeTab === "all"
											? "Você ainda não fez nenhum pedido"
											: `Você não tem pedidos ${
													activeTab === "active"
														? "em andamento"
														: activeTab === "completed"
														? "entregues"
														: "cancelados"
											  }`}
									</p>
									<Button asChild className="bg-pink-600 hover:bg-pink-700">
										<Link href="/cegs">Explorar CEGs</Link>
									</Button>
								</CardContent>
							</Card>
						) : (
							filteredOrders.map((order) => {
								const statusInfo = getStatusInfo(order.status);
								return (
									<Card
										key={order.id}
										className="border-0 shadow-sm hover:shadow-md transition-shadow"
									>
										<CardContent className="p-0">
											<div className="flex flex-col md:flex-row">
												{/* Order Items Preview */}
												<div className="flex gap-2 p-4 md:w-32 md:flex-col md:items-center md:justify-center bg-gray-50 md:rounded-l-lg">
													{order.items.slice(0, 3).map((item, idx) => (
														<div
															key={item.id}
															className="w-16 h-20 md:w-20 md:h-24 rounded-lg overflow-hidden bg-gray-200 shrink-0"
															style={{
																marginLeft: idx > 0 ? "-8px" : "0",
																zIndex: 3 - idx,
															}}
														>
															<img
																src={
																	item.photocardImageUrl ||
																	`/placeholder.svg?height=96&width=80&query=${item.photocardIdol} photocard`
																}
																alt={item.photocardName || "Photocard"}
																className="w-full h-full object-cover"
															/>
														</div>
													))}
													{order.items.length > 3 && (
														<div className="w-16 h-20 md:w-20 md:h-24 rounded-lg bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0 -ml-2">
															+{order.items.length - 3}
														</div>
													)}
													{order.items.length === 0 && (
														<div className="w-16 h-20 md:w-20 md:h-24 rounded-lg bg-gray-200 flex items-center justify-center">
															<Package className="w-6 h-6 text-gray-400" />
														</div>
													)}
												</div>

												{/* Order Details */}
												<div className="flex-1 p-4">
													<div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
														<div className="flex-1">
															<div className="flex items-center gap-2 mb-1">
																<Link
																	href={`/cegs/${order.groupPurchaseId}`}
																	className="font-semibold hover:text-pink-600 transition-colors line-clamp-1"
																>
																	{order.groupPurchaseTitle || "CEG"}
																</Link>
																{order.groupPurchaseType && (
																	<span className="text-muted-foreground">
																		{order.groupPurchaseType === "national" ? (
																			<MapPin className="w-3 h-3" />
																		) : (
																			<Globe className="w-3 h-3" />
																		)}
																	</span>
																)}
															</div>

															<div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
																<span className="flex items-center gap-1">
																	<Calendar className="w-3 h-3" />
																	{formatDate(order.createdAt)}
																</span>
																<span>
																	{order.items.length} item
																	{order.items.length !== 1 ? "s" : ""}
																</span>
															</div>

															{/* Items Preview */}
															<div className="text-sm text-muted-foreground">
																{order.items
																	.slice(0, 2)
																	.map((item) => item.photocardName)
																	.filter(Boolean)
																	.join(", ")}
																{order.items.length > 2 && (
																	<span> e mais {order.items.length - 2}</span>
																)}
															</div>
														</div>

														<div className="flex flex-row md:flex-col items-center md:items-end gap-3">
															<Badge
																className={`${statusInfo.bgColor} ${statusInfo.color} border flex items-center gap-1`}
															>
																{statusInfo.icon}
																{statusInfo.label}
															</Badge>
															<p className="text-xl font-bold text-pink-600">
																R$ {order.totalAmount.toFixed(2)}
															</p>
														</div>
													</div>

													<div className="flex items-center justify-between mt-4 pt-4 border-t">
														<p className="text-xs text-muted-foreground">
															Pedido #{order.id.slice(0, 8)}
														</p>
														<Button
															variant="ghost"
															size="sm"
															className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
															onClick={() => {
																setSelectedOrder(order);
																setShowDetailsDialog(true);
															}}
														>
															<Eye className="w-4 h-4 mr-1" />
															Ver Detalhes
														</Button>
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								);
							})
						)}
					</TabsContent>
				</Tabs>
			</div>

			{/* Order Details Dialog */}
			<Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Detalhes do Pedido</DialogTitle>
						<DialogDescription>
							Pedido #{selectedOrder?.id.slice(0, 8)}
						</DialogDescription>
					</DialogHeader>

					{selectedOrder && (
						<div className="space-y-6">
							{/* Status */}
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-muted-foreground">Status</p>
									<Badge
										className={`${
											getStatusInfo(selectedOrder.status).bgColor
										} ${
											getStatusInfo(selectedOrder.status).color
										} border flex items-center gap-1 mt-1`}
									>
										{getStatusInfo(selectedOrder.status).icon}
										{getStatusInfo(selectedOrder.status).label}
									</Badge>
								</div>
								<div className="text-right">
									<p className="text-sm text-muted-foreground">Total</p>
									<p className="text-2xl font-bold text-pink-600">
										R$ {selectedOrder.totalAmount.toFixed(2)}
									</p>
								</div>
							</div>

							{/* CEG Info */}
							<div className="bg-gray-50 rounded-lg p-4">
								<p className="text-sm text-muted-foreground mb-1">CEG</p>
								<Link
									href={`/cegs/${selectedOrder.groupPurchaseId}`}
									className="font-semibold hover:text-pink-600 transition-colors flex items-center gap-2"
								>
									{selectedOrder.groupPurchaseTitle}
									<ArrowRight className="w-4 h-4" />
								</Link>
								<p className="text-xs text-muted-foreground mt-1">
									{selectedOrder.groupPurchaseType === "national"
										? "CEG Nacional"
										: "CEG Internacional"}
								</p>
							</div>

							{/* Items */}
							<div>
								<p className="text-sm font-semibold mb-3">
									Itens do Pedido ({selectedOrder.items.length})
								</p>
								<div className="space-y-3">
									{selectedOrder.items.map((item) => (
										<div
											key={item.id}
											className="flex items-center gap-3 bg-gray-50 rounded-lg p-3"
										>
											<div className="w-16 h-20 rounded-lg overflow-hidden bg-gray-200 shrink-0">
												<img
													src={
														item.photocardImageUrl ||
														`/placeholder.svg?height=80&width=64&query=${item.photocardIdol} photocard`
													}
													alt={item.photocardName || "Photocard"}
													className="w-full h-full object-cover"
												/>
											</div>
											<div className="flex-1 min-w-0">
												<p className="font-medium line-clamp-1">
													{item.photocardName || "Photocard"}
												</p>
												<p className="text-sm text-muted-foreground">
													{item.photocardIdol}
													{item.photocardGroup && ` - ${item.photocardGroup}`}
												</p>
												<p className="text-xs text-muted-foreground">
													Qtd: {item.quantity}
												</p>
											</div>
											<p className="font-semibold text-pink-600">
												R$ {(item.unitPrice * item.quantity).toFixed(2)}
											</p>
										</div>
									))}
								</div>
							</div>

							{/* Order Info */}
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<p className="text-muted-foreground">Data do Pedido</p>
									<p className="font-medium">
										{new Date(selectedOrder.createdAt).toLocaleDateString(
											"pt-BR",
											{
												day: "2-digit",
												month: "long",
												year: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											}
										)}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Última Atualização</p>
									<p className="font-medium">
										{new Date(selectedOrder.updatedAt).toLocaleDateString(
											"pt-BR",
											{
												day: "2-digit",
												month: "long",
												year: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											}
										)}
									</p>
								</div>
							</div>

							{/* Contact Info */}
							{selectedOrder.contactInfo && (
								<div>
									<p className="text-sm font-semibold mb-2">
										Informações de Contato
									</p>
									<div className="bg-gray-50 rounded-lg p-3 text-sm">
										{selectedOrder.contactInfo.telefone && (
											<p>
												<span className="text-muted-foreground">Telefone:</span>{" "}
												{selectedOrder.contactInfo.telefone}
											</p>
										)}
										{selectedOrder.contactInfo.observacoes && (
											<p className="mt-1">
												<span className="text-muted-foreground">
													Observações:
												</span>{" "}
												{selectedOrder.contactInfo.observacoes}
											</p>
										)}
									</div>
								</div>
							)}

							{/* Actions */}
							<div className="flex gap-3 pt-4 border-t">
								<Button asChild variant="outline" className="flex-1">
									<Link href={`/cegs/${selectedOrder.groupPurchaseId}`}>
										Ver CEG
									</Link>
								</Button>
								<Button
									className="flex-1 bg-pink-600 hover:bg-pink-700"
									onClick={() => setShowDetailsDialog(false)}
								>
									Fechar
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
