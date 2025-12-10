"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Heart,
	LayoutGrid,
	ShoppingBag,
	UserIcon,
	Package,
	Bell,
	CheckCheck,
	XCircle,
	AlertCircle,
	Info,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
	id: string;
	userId: string;
	type:
		| "new_order"
		| "order_canceled"
		| "photocard_removed"
		| "order_status_changed"
		| "general";
	title: string;
	message: string;
	relatedOrderId?: string;
	relatedCegId?: string;
	read: boolean;
	emailSent: boolean;
	createdAt: string;
}

export function Navbar() {
	const pathname = usePathname();
	const router = useRouter();
	const [user, setUser] = useState<{
		id: string;
		email: string;
		name?: string;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [notificationsOpen, setNotificationsOpen] = useState(false);

	const fetchNotifications = useCallback(async () => {
		if (!user) return;
		try {
			const response = await fetch("/api/notifications?limit=10");
			if (response.ok) {
				const data = await response.json();
				setNotifications(data.notifications || []);
				setUnreadCount(data.unreadCount || 0);
			}
		} catch (error) {
			console.error("Error fetching notifications:", error);
		}
	}, [user]);

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const { data } = await authClient.getSession();
				// Extract user data from the session
				if (data?.session) {
					// Fetch user profile from API
					const response = await fetch("/api/user/profile");
					if (response.ok) {
						const userData = await response.json();
						setUser(userData);
					} else {
						setUser(null);
					}
				} else {
					setUser(null);
				}
			} catch (error) {
				console.error("Error fetching user session:", error);
				setUser(null);
			} finally {
				setLoading(false);
			}
		};

		fetchUser();

		// We don't have a direct subscription method in Better Auth client
		// So we'll poll for session changes periodically
		const interval = setInterval(fetchUser, 60000); // Check every minute

		return () => {
			clearInterval(interval);
		};
	}, []);

	// Fetch notifications when user is loaded
	useEffect(() => {
		if (user) {
			fetchNotifications();
			// Poll for new notifications every 30 seconds
			const interval = setInterval(fetchNotifications, 30000);
			return () => clearInterval(interval);
		}
	}, [user, fetchNotifications]);

	const handleLogout = async () => {
		await authClient.signOut({});
		router.push("/");
	};

	const markAllAsRead = async () => {
		try {
			await fetch("/api/notifications", { method: "PUT" });
			setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
			setUnreadCount(0);
		} catch (error) {
			console.error("Error marking notifications as read:", error);
		}
	};

	const markAsRead = async (notificationId: string) => {
		try {
			await fetch(`/api/notifications/${notificationId}`, { method: "PUT" });
			setNotifications((prev) =>
				prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
			);
			setUnreadCount((prev) => Math.max(0, prev - 1));
		} catch (error) {
			console.error("Error marking notification as read:", error);
		}
	};

	const getNotificationIcon = (type: Notification["type"]) => {
		switch (type) {
			case "new_order":
				return <ShoppingBag className="w-4 h-4 text-green-500" />;
			case "order_canceled":
			case "photocard_removed":
				return <XCircle className="w-4 h-4 text-red-500" />;
			case "order_status_changed":
				return <AlertCircle className="w-4 h-4 text-blue-500" />;
			default:
				return <Info className="w-4 h-4 text-gray-500" />;
		}
	};

	return (
		<nav className="border-b bg-white sticky top-0 z-50">
			<div className="container mx-auto px-4 h-16 flex items-center justify-between">
				<Link href="/" className="flex items-center gap-2">
					<div className="w-8 h-8 bg-linear-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
						<span className="text-white font-bold text-sm">RC</span>
					</div>
					<span className="font-bold text-xl text-pink-600">RinaCards</span>
				</Link>

				<div className="flex items-center gap-4">
					<Link href="/marketplace">
						<Button
							variant={pathname === "/marketplace" ? "default" : "ghost"}
							className={
								pathname === "/marketplace"
									? "bg-pink-600 hover:bg-pink-700"
									: ""
							}
						>
							<ShoppingBag className="w-4 h-4 mr-2" />
							Marketplace
						</Button>
					</Link>

					{!loading && user && (
						<>
							<Link href="/minhas-wishlists">
								<Button
									variant={
										pathname === "/minhas-wishlists" ? "default" : "ghost"
									}
									className={
										pathname === "/minhas-wishlists"
											? "bg-pink-600 hover:bg-pink-700"
											: ""
									}
								>
									<Heart className="w-4 h-4 mr-2" />
									Wishlists
								</Button>
							</Link>

							<Link href="/cegs">
								<Button
									variant={pathname === "/cegs" ? "default" : "ghost"}
									className={
										pathname === "/cegs" ? "bg-pink-600 hover:bg-pink-700" : ""
									}
								>
									<LayoutGrid className="w-4 h-4 mr-2" />
									CEGs
								</Button>
							</Link>

							<Link href="/meus-pedidos">
								<Button
									variant={pathname === "/meus-pedidos" ? "default" : "ghost"}
									className={
										pathname === "/meus-pedidos"
											? "bg-pink-600 hover:bg-pink-700"
											: ""
									}
								>
									<Package className="w-4 h-4 mr-2" />
									Pedidos
								</Button>
							</Link>

							{/* Notifications Dropdown */}
							<DropdownMenu
								open={notificationsOpen}
								onOpenChange={setNotificationsOpen}
							>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon" className="relative">
										<Bell className="w-5 h-5" />
										{unreadCount > 0 && (
											<span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 text-white text-xs rounded-full flex items-center justify-center">
												{unreadCount > 9 ? "9+" : unreadCount}
											</span>
										)}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-80">
									<div className="flex items-center justify-between px-2 py-1.5">
										<DropdownMenuLabel className="p-0">
											Notificações
										</DropdownMenuLabel>
										{unreadCount > 0 && (
											<Button
												variant="ghost"
												size="sm"
												className="h-auto p-1 text-xs text-pink-600 hover:text-pink-700"
												onClick={(e) => {
													e.preventDefault();
													markAllAsRead();
												}}
											>
												<CheckCheck className="w-3 h-3 mr-1" />
												Marcar todas como lidas
											</Button>
										)}
									</div>
									<DropdownMenuSeparator />
									<ScrollArea className="h-[300px]">
										{notifications.length === 0 ? (
											<div className="py-8 text-center text-sm text-muted-foreground">
												<Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
												<p>Nenhuma notificação</p>
											</div>
										) : (
											<div className="space-y-1 p-1">
												{notifications.map((notification) => (
													<div
														key={notification.id}
														className={`p-3 rounded-lg cursor-pointer transition-colors ${
															notification.read
																? "bg-white hover:bg-gray-50"
																: "bg-pink-50 hover:bg-pink-100"
														}`}
														onClick={() => {
															if (!notification.read) {
																markAsRead(notification.id);
															}
															if (notification.relatedCegId) {
																router.push(
																	`/cegs/${notification.relatedCegId}`
																);
																setNotificationsOpen(false);
															} else if (notification.relatedOrderId) {
																router.push("/meus-pedidos");
																setNotificationsOpen(false);
															}
														}}
													>
														<div className="flex gap-3">
															<div className="shrink-0 mt-0.5">
																{getNotificationIcon(notification.type)}
															</div>
															<div className="flex-1 min-w-0">
																<p
																	className={`text-sm font-medium ${
																		!notification.read ? "text-pink-900" : ""
																	}`}
																>
																	{notification.title}
																</p>
																<p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
																	{notification.message}
																</p>
																<p className="text-xs text-muted-foreground mt-1">
																	{formatDistanceToNow(
																		new Date(notification.createdAt),
																		{
																			addSuffix: true,
																			locale: ptBR,
																		}
																	)}
																</p>
															</div>
															{!notification.read && (
																<div className="w-2 h-2 bg-pink-600 rounded-full shrink-0 mt-1.5" />
															)}
														</div>
													</div>
												))}
											</div>
										)}
									</ScrollArea>
								</DropdownMenuContent>
							</DropdownMenu>

							{/* User Menu Dropdown */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon">
										<UserIcon className="w-5 h-5" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Link href="/perfil">Perfil</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link href="/meus-pedidos">Meus Pedidos</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={handleLogout}
										className="text-red-600"
									>
										Sair
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</>
					)}

					{!loading && !user && (
						<Link href="/auth/login">
							<Button className="bg-pink-600 hover:bg-pink-700">Entrar</Button>
						</Link>
					)}
				</div>
			</div>
		</nav>
	);
}
