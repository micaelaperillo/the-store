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

import type { CheckoutRequest } from "../models/CheckoutRequest";
import type { ShippingRates } from "../models/ShippingRates";
import type { IShippingService } from "./IShippingService";

export class MockShippingService implements IShippingService {
	constructor(private prefix: string) {}

	async getShippingRates(_request: CheckoutRequest): Promise<ShippingRates> {
		return Promise.resolve({
			rates: [
				{
					amount: 10,
					estimatedDays: 10,
					name: `${this.prefix}Priority Mail`,
					token: "priority-mail",
				},
				{
					amount: 25,
					estimatedDays: 5,
					name: `${this.prefix}Priority Mail Express`,
					token: "priority-mail-express",
				},
			],
			shipmentId: this.makeid(32),
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
