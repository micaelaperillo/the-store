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

import {
	type MiddlewareConsumer,
	Module,
	type NestModule,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TerminusModule } from "@nestjs/terminus";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { OpenTelemetryModule } from "nestjs-otel";
import { AppController } from "./app.controller";
import { ChaosController } from "./chaos/chaos.controller";
import { ChaosHealthIndicator } from "./chaos/chaos.health";
import { ChaosMiddleware } from "./chaos/chaos.middleware";
import { ChaosService } from "./chaos/chaos.service";
import { CheckoutModule } from "./checkout/checkout.module";
import configuration from "./config/configuration";
import { LoggerMiddleware } from "./middleware/logger.middleware";

const OpenTelemetryModuleConfig = OpenTelemetryModule.forRoot({});

@Module({
	controllers: [AppController, ChaosController],
	imports: [
		ConfigModule.forRoot({
			load: [configuration],
		}),
		TerminusModule,
		PrometheusModule.register(),
		CheckoutModule,
		OpenTelemetryModuleConfig,
	],
	providers: [ChaosService, ChaosHealthIndicator],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LoggerMiddleware).exclude("health").forRoutes("*");
		consumer.apply(ChaosMiddleware).forRoutes("checkout/*splat");
	}
}
