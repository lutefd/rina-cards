"use client";

import { useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { updateOrderStatus } from "@/lib/api-client";
import { Search, Mail, Phone, AlertTriangle } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface OrderItem {
	id: string;
	productId: string;
	quantity: number;
	unitPrice: number;
	photocard: string | null;
	idol: string | null;
	group: string | null;
}

interface Pedido {
	id: string;
	quantity: number;
	unitPrice: number;
	totalAmount: number;
	status: string;
	contactInfo: any;
	notes: string | null;
	user: {
		name: string | null;
		email: string | null;
		phone?: string | null;
	};
	product?: {
		name: string;
		idol?: string | null;
		group?: string | null;
	};
	itemCount?: number;
}

interface GerenciadorPedidosProps {
	cegId: string;
	pedidos: Pedido[];
}

const STATUS_OPTIONS = [
	{ value: "all", label: "Todos" },
	{ value: "pending", label: "Pendentes" },
	{ value: "confirmed", label: "Confirmados" },
	{ value: "paid", label: "Pagos" },
	{ value: "shipped", label: "Enviados" },
	{ value: "delivered", label: "Entregues" },
	{ value: "canceled", label: "Cancelados" },
];

export function GerenciadorPedidos({
	cegId,
	pedidos: initialPedidos,
}: GerenciadorPedidosProps) {
	const [pedidos, setPedidos] = useState(initialPedidos);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
	const [showDetailsDialog, setShowDetailsDialog] = useState(false);

	// Order items fetched on-demand
	const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
	const [loadingItems, setLoadingItems] = useState(false);

	// Cancel confirmation modal state
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [cancelingPedido, setCancelingPedido] = useState<Pedido | null>(null);
	const [restockItems, setRestockItems] = useState(true);
	const [isCanceling, setIsCanceling] = useState(false);

	const getStatusVariant = (status: string) => {
		switch (status) {
			case "confirmed":
				return "default";
			case "paid":
				return "default";
			case "shipped":
				return "secondary";
			case "delivered":
				return "outline";
			case "canceled":
				return "destructive";
			default:
				return "outline";
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case "pending":
				return "Pendente";
			case "confirmed":
				return "Confirmado";
			case "paid":
				return "Pago";
			case "shipped":
				return "Enviado";
			case "delivered":
				return "Entregue";
			case "canceled":
				return "Cancelado";
			default:
				return status;
		}
	};

	const updateStatus = async (pedidoId: string, novoStatus: string) => {
		// If canceling, show confirmation dialog
		if (novoStatus === "canceled") {
			const pedido = pedidos.find((p) => p.id === pedidoId);
			if (pedido) {
				setCancelingPedido(pedido);
				setRestockItems(true); // Default to restock
				setShowCancelDialog(true);
			}
			return;
		}

		try {
			// Call the API to update the order status
			await updateOrderStatus(pedidoId, novoStatus);

			// Update the local state
			setPedidos(
				pedidos.map((p) =>
					p.id === pedidoId ? { ...p, status: novoStatus } : p
				)
			);

			// Show success message
			toast.success("Status atualizado com sucesso");
		} catch (error) {
			console.error("Error updating order status:", error);
			toast.error("Erro ao atualizar status");
		}
	};

	const confirmCancelOrder = async () => {
		if (!cancelingPedido) return;

		setIsCanceling(true);
		try {
			// Call the API with restockItems option
			await updateOrderStatus(cancelingPedido.id, "canceled", { restockItems });

			// Update the local state
			setPedidos(
				pedidos.map((p) =>
					p.id === cancelingPedido.id ? { ...p, status: "canceled" } : p
				)
			);

			// Show success message
			toast.success(
				restockItems
					? "Pedido cancelado e estoque restaurado"
					: "Pedido cancelado (estoque não alterado)"
			);

			// Close dialog
			setShowCancelDialog(false);
			setCancelingPedido(null);
		} catch (error) {
			console.error("Error canceling order:", error);
			toast.error("Erro ao cancelar pedido");
		} finally {
			setIsCanceling(false);
		}
	};

	// Fetch order items when opening details
	const openOrderDetails = async (pedido: Pedido) => {
		setSelectedPedido(pedido);
		setOrderItems([]);
		setShowDetailsDialog(true);

		// Fetch items if order has multiple items
		if (pedido.itemCount && pedido.itemCount > 0) {
			setLoadingItems(true);
			try {
				const res = await fetch(`/api/orders/${pedido.id}/items`);
				if (res.ok) {
					const data = await res.json();
					setOrderItems(data.items || []);
				}
			} catch (error) {
				console.error("Error fetching order items:", error);
			} finally {
				setLoadingItems(false);
			}
		}
	};

	const filteredPedidos = pedidos.filter((p) => {
		// Status filter
		if (statusFilter !== "all" && p.status !== statusFilter) {
			return false;
		}
		// Search filter
		if (searchTerm) {
			const search = searchTerm.toLowerCase();
			return (
				p.user.name?.toLowerCase().includes(search) ||
				p.user.email?.toLowerCase().includes(search) ||
				p.product?.name.toLowerCase().includes(search) ||
				p.product?.idol?.toLowerCase().includes(search)
			);
		}
		return true;
	});

	const totalReceber = pedidos
		.filter((p) => p.status !== "canceled")
		.reduce((acc, p) => acc + p.totalAmount, 0);

	// Count by status for tabs
	const statusCounts = {
		all: pedidos.length,
		pending: pedidos.filter((p) => p.status === "pending").length,
		confirmed: pedidos.filter((p) => p.status === "confirmed").length,
		paid: pedidos.filter((p) => p.status === "paid").length,
		shipped: pedidos.filter((p) => p.status === "shipped").length,
		delivered: pedidos.filter((p) => p.status === "delivered").length,
		canceled: pedidos.filter((p) => p.status === "canceled").length,
	};

	return (
		<div className="space-y-6">
			{/* Estatísticas */}
			<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
				<div className="bg-white rounded-lg p-4">
					<p className="text-sm text-muted-foreground">Total de Pedidos</p>
					<p className="text-2xl font-bold">{pedidos.length}</p>
				</div>
				<div className="bg-white rounded-lg p-4">
					<p className="text-sm text-muted-foreground">Pendentes</p>
					<p className="text-2xl font-bold text-yellow-600">
						{statusCounts.pending}
					</p>
				</div>
				<div className="bg-white rounded-lg p-4">
					<p className="text-sm text-muted-foreground">Confirmados</p>
					<p className="text-2xl font-bold text-blue-600">
						{statusCounts.confirmed}
					</p>
				</div>
				<div className="bg-white rounded-lg p-4">
					<p className="text-sm text-muted-foreground">Entregues</p>
					<p className="text-2xl font-bold text-green-600">
						{statusCounts.delivered}
					</p>
				</div>
				<div className="bg-white rounded-lg p-4">
					<p className="text-sm text-muted-foreground">Total a Receber</p>
					<p className="text-2xl font-bold text-pink-600">
						R$ {totalReceber.toFixed(2)}
					</p>
				</div>
			</div>

			{/* Status Filter Tabs */}
			<div className="bg-white rounded-lg p-2">
				<div className="flex flex-wrap gap-2">
					{STATUS_OPTIONS.map((option) => (
						<Button
							key={option.value}
							variant={statusFilter === option.value ? "default" : "outline"}
							size="sm"
							onClick={() => setStatusFilter(option.value)}
							className={
								statusFilter === option.value
									? "bg-pink-600 hover:bg-pink-700"
									: ""
							}
						>
							{option.label}
							<span className="ml-1.5 text-xs opacity-70">
								({statusCounts[option.value as keyof typeof statusCounts]})
							</span>
						</Button>
					))}
				</div>
			</div>

			{/* Filtros e Busca */}
			<div className="bg-white rounded-lg p-4">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Buscar por comprador, photocard ou idol..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-9"
					/>
				</div>
			</div>

			{/* Tabela de Pedidos */}
			<div className="bg-white rounded-lg overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Comprador</TableHead>
							<TableHead>Photocard</TableHead>
							<TableHead>Qtd</TableHead>
							<TableHead>Preço Total</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Contato</TableHead>
							<TableHead>Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredPedidos.map((pedido) => (
							<TableRow key={pedido.id}>
								<TableCell className="font-medium">
									{pedido.user.name || pedido.user.email}
								</TableCell>
								<TableCell>
									<div>
										<p className="font-medium">
											{pedido.product?.name || "Photocard"}
											{pedido.itemCount && pedido.itemCount > 1 && (
												<span className="ml-1 text-xs text-pink-600">
													+{pedido.itemCount - 1} mais
												</span>
											)}
										</p>
										<p className="text-sm text-muted-foreground">
											{pedido.product?.idol || ""}{" "}
											{pedido.product?.group ? `- ${pedido.product.group}` : ""}
										</p>
									</div>
								</TableCell>
								<TableCell>{pedido.quantity}</TableCell>
								<TableCell className="font-medium">
									R$ {pedido.totalAmount.toFixed(2)}
								</TableCell>
								<TableCell>
									<Select
										value={pedido.status}
										onValueChange={(value) => updateStatus(pedido.id, value)}
									>
										<SelectTrigger className="w-[140px]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="pending">Pendente</SelectItem>
											<SelectItem value="confirmed">Confirmado</SelectItem>
											<SelectItem value="paid">Pago</SelectItem>
											<SelectItem value="shipped">Enviado</SelectItem>
											<SelectItem value="delivered">Entregue</SelectItem>
											<SelectItem value="canceled">Cancelado</SelectItem>
										</SelectContent>
									</Select>
								</TableCell>
								<TableCell>
									<div className="flex gap-2">
										{pedido.user.email && (
											<a
												href={`mailto:${pedido.user.email}`}
												title={pedido.user.email}
											>
												<Button size="icon" variant="ghost">
													<Mail className="w-4 h-4" />
												</Button>
											</a>
										)}
										{pedido.user.phone && (
											<a
												href={`tel:${pedido.user.phone}`}
												title={pedido.user.phone}
											>
												<Button size="icon" variant="ghost">
													<Phone className="w-4 h-4" />
												</Button>
											</a>
										)}
									</div>
								</TableCell>
								<TableCell>
									<Button
										size="sm"
										variant="outline"
										onClick={() => openOrderDetails(pedido)}
									>
										Detalhes
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>

				{filteredPedidos.length === 0 && (
					<div className="text-center py-12">
						<p className="text-muted-foreground">
							{searchTerm ? "Nenhum pedido encontrado" : "Nenhum pedido ainda"}
						</p>
					</div>
				)}
			</div>

			{/* Dialog de Detalhes */}
			<Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
				<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Detalhes do Pedido</DialogTitle>
						<DialogDescription>
							Informações completas sobre o pedido
						</DialogDescription>
					</DialogHeader>

					{selectedPedido && (
						<div className="space-y-4">
							<div>
								<p className="text-sm font-semibold">Comprador</p>
								<p>{selectedPedido.user.name}</p>
								<p className="text-sm text-muted-foreground">
									{selectedPedido.user.email}
								</p>
								{selectedPedido.user.phone && (
									<p className="text-sm text-muted-foreground">
										{selectedPedido.user.phone}
									</p>
								)}
							</div>

							{/* Show all items if available */}
							{loadingItems ? (
								<div className="text-center py-4">
									<p className="text-sm text-muted-foreground">
										Carregando itens...
									</p>
								</div>
							) : orderItems.length > 0 ? (
								<div>
									<p className="text-sm font-semibold mb-2">
										Itens do Pedido ({orderItems.length})
									</p>
									<div className="space-y-2 max-h-48 overflow-y-auto">
										{orderItems.map((item: OrderItem, index: number) => (
											<div
												key={item.id || index}
												className="bg-gray-50 p-3 rounded-lg flex justify-between items-center"
											>
												<div>
													<p className="font-medium text-sm">
														{item.photocard || "Photocard"}
													</p>
													<p className="text-xs text-muted-foreground">
														{item.idol || ""}
														{item.group ? ` • ${item.group}` : ""}
													</p>
												</div>
												<div className="text-right">
													<p className="text-sm font-medium">
														{item.quantity}x R$ {item.unitPrice.toFixed(2)}
													</p>
													<p className="text-xs text-muted-foreground">
														R$ {(item.quantity * item.unitPrice).toFixed(2)}
													</p>
												</div>
											</div>
										))}
									</div>
								</div>
							) : (
								<div>
									<p className="text-sm font-semibold">Photocard</p>
									<p>{selectedPedido.product?.name || "Photocard"}</p>
									<p className="text-sm text-muted-foreground">
										{selectedPedido.product?.idol || ""}{" "}
										{selectedPedido.product?.group
											? `- ${selectedPedido.product.group}`
											: ""}
									</p>
									<div className="grid grid-cols-2 gap-4 mt-2">
										<div>
											<p className="text-xs text-muted-foreground">
												Quantidade
											</p>
											<p className="text-sm">{selectedPedido.quantity}</p>
										</div>
										<div>
											<p className="text-xs text-muted-foreground">
												Preço Unitário
											</p>
											<p className="text-sm">
												R$ {selectedPedido.unitPrice.toFixed(2)}
											</p>
										</div>
									</div>
								</div>
							)}

							<div>
								<p className="text-sm font-semibold">Preço Total</p>
								<p className="text-lg font-bold text-pink-600">
									R$ {selectedPedido.totalAmount.toFixed(2)}
								</p>
							</div>

							{selectedPedido.notes && (
								<div>
									<p className="text-sm font-semibold">Notas</p>
									<p className="text-sm">{selectedPedido.notes}</p>
								</div>
							)}

							{selectedPedido.contactInfo && (
								<div>
									<p className="text-sm font-semibold">
										Informações de Contato
									</p>
									<div className="bg-gray-50 p-3 rounded space-y-1">
										{selectedPedido.contactInfo.telefone && (
											<p className="text-sm">
												<span className="font-medium">Telefone:</span>{" "}
												<a
													href={`tel:${selectedPedido.contactInfo.telefone}`}
													className="text-pink-600 hover:underline"
												>
													{selectedPedido.contactInfo.telefone}
												</a>
											</p>
										)}
										{selectedPedido.contactInfo.observacoes && (
											<p className="text-sm">
												<span className="font-medium">Observações:</span>{" "}
												{selectedPedido.contactInfo.observacoes}
											</p>
										)}
									</div>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Cancel Confirmation Dialog */}
			<Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<AlertTriangle className="w-5 h-5 text-amber-500" />
							Cancelar Pedido
						</DialogTitle>
						<DialogDescription>
							Tem certeza que deseja cancelar este pedido?
						</DialogDescription>
					</DialogHeader>

					{cancelingPedido && (
						<div className="space-y-4">
							<div className="bg-gray-50 p-3 rounded-lg">
								<p className="text-sm">
									<span className="font-medium">Comprador:</span>{" "}
									{cancelingPedido.user.name || cancelingPedido.user.email}
								</p>
								<p className="text-sm">
									<span className="font-medium">Valor:</span> R${" "}
									{cancelingPedido.totalAmount.toFixed(2)}
								</p>
								{cancelingPedido.product && (
									<p className="text-sm">
										<span className="font-medium">Photocard:</span>{" "}
										{cancelingPedido.product.name}
									</p>
								)}
							</div>

							<div className="flex items-center space-x-2">
								<Checkbox
									id="restock"
									checked={restockItems}
									onCheckedChange={(checked) =>
										setRestockItems(checked === true)
									}
								/>
								<Label
									htmlFor="restock"
									className="text-sm font-normal cursor-pointer"
								>
									Restaurar estoque dos itens cancelados
								</Label>
							</div>

							<p className="text-xs text-muted-foreground">
								{restockItems
									? "Os itens serão devolvidos ao estoque automaticamente."
									: "O estoque não será alterado. Você pode ajustar manualmente depois."}
							</p>
						</div>
					)}

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setShowCancelDialog(false);
								setCancelingPedido(null);
							}}
							disabled={isCanceling}
						>
							Voltar
						</Button>
						<Button
							variant="destructive"
							onClick={confirmCancelOrder}
							disabled={isCanceling}
						>
							{isCanceling ? "Cancelando..." : "Confirmar Cancelamento"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
