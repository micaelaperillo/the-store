/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { Inject, Injectable } from "@nestjs/common";
import { deserialize, serialize } from "class-transformer";
import { Checkout } from "./models/Checkout";
import type { CheckoutRequest } from "./models/CheckoutRequest";
import type { CheckoutSubmitted } from "./models/CheckoutSubmitted";
import type { Item } from "./models/Item";
import type { ShippingRates } from "./models/ShippingRates";
import type { IOrdersService } from "./orders/IOrdersService";
import type { ICheckoutRepository } from "./repositories";
import type { IShippingService } from "./shipping";

@Injectable()
export class CheckoutService {
	constructor(
		@Inject("CheckoutRepository")
		private checkoutRepository: ICheckoutRepository,
		@Inject("OrdersService") private ordersService: IOrdersService,
		@Inject("ShippingService") private shippingService: IShippingService,
	) {}

	async get(customerId: string): Promise<Checkout> {
		const json = await this.checkoutRepository.get(customerId);

		if (!json) {
			return null;
		}

		return deserialize(Checkout, json);
	}

	async update(
		customerId: string,
		request: CheckoutRequest,
	): Promise<Checkout> {
		let subtotal = 0;

		const items: Item[] = request.items.map((item) => {
			const totalCost = item.price * item.quantity;
			subtotal += totalCost;

			return {
				...item,
				totalCost,
			};
		});

		const tax = request.shippingAddress ? 5 : -1; // Hardcoded $10 tax for now
		const effectiveTax = tax === -1 ? 0 : tax;

		let shipping = -1;
		let shippingRates: ShippingRates = null;

		if (request.shippingAddress) {
			shippingRates = await this.shippingService.getShippingRates(request);

			if (shippingRates) {
				for (let i = 0; i < shippingRates.rates.length; i++) {
					if (shippingRates.rates[i].token === request.deliveryOptionToken) {
						shipping = shippingRates.rates[i].amount;
					}
				}
			}
		}

		const effectiveShipping = shipping === -1 ? 0 : shipping;

		const checkout: Checkout = {
			deliveryOptionToken: request.deliveryOptionToken,
			items,
			paymentId: this.makeid(16),
			paymentToken: this.makeid(32),
			shipping,
			shippingAddress: request.shippingAddress,
			shippingRates,
			subtotal,
			tax,
			total: subtotal + effectiveTax + effectiveShipping,
		};

		await this.checkoutRepository.set(customerId, serialize(checkout));

		return checkout;
	}

	async submit(customerId: string): Promise<CheckoutSubmitted> {
		const checkout = await this.get(customerId);

		if (!checkout) {
			throw new Error("Checkout not found");
		}

		const order = await this.ordersService.create(checkout);

		await this.checkoutRepository.remove(customerId);

		return Promise.resolve({
			email: checkout.shippingAddress.email,
			items: checkout.items,
			orderId: order.id,
			shipping: checkout.shipping,
			subtotal: checkout.subtotal,
			tax: checkout.tax,
			total: checkout.total,
		});
	}

	private makeid(length) {
		let result = "";
		const characters =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		const charactersLength = characters.length;
		for (let i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}
}
