/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { getCurrencyFromPriceResponse } from '@woocommerce/price-format';
import { useEffect, useRef } from '@wordpress/element';
import PaymentMethodLabel from '@woocommerce/base-components/cart-checkout/payment-method-label';
import PaymentMethodIcons from '@woocommerce/base-components/cart-checkout/payment-method-icons';
import { getSetting } from '@woocommerce/settings';

/**
 * Internal dependencies
 */
import { ValidationInputError } from '../../providers/validation';
import { useStoreCart } from '../cart/use-store-cart';
import { useStoreCartCoupons } from '../cart/use-store-cart-coupons';
import { useEmitResponse } from '../use-emit-response';
import { useCheckoutContext } from '../../providers/cart-checkout/checkout-state';
import { usePaymentMethodDataContext } from '../../providers/cart-checkout/payment-methods';
import { useShippingDataContext } from '../../providers/cart-checkout/shipping';
import { useCustomerDataContext } from '../../providers/cart-checkout/customer';

/**
 * @typedef {import('@woocommerce/type-defs/registered-payment-method-props').RegisteredPaymentMethodProps} RegisteredPaymentMethodProps
 * @typedef {import('@woocommerce/type-defs/cart').CartTotalItem} CartTotalItem
 */

/**
 * Prepares the total items into a shape usable for display as passed on to
 * registered payment methods.
 *
 * @param {Object} totals Current cart total items
 * @param {boolean} needsShipping Whether or not shipping is needed.
 *
 * @return {CartTotalItem[]}  Array for cart total items prepared for use.
 */
export const prepareTotalItems = ( totals, needsShipping ) => {
	const newTotals = [];
	const factory = ( label, property ) => {
		const value = parseInt( totals[ property ], 10 );
		const tax = parseInt( totals[ property + '_tax' ], 10 );
		return {
			label,
			value,
			valueWithTax: value + tax,
		};
	};
	newTotals.push(
		factory(
			__( 'Subtotal:', 'woo-gutenberg-products-block' ),
			'total_items'
		)
	);
	newTotals.push(
		factory( __( 'Fees:', 'woo-gutenberg-products-block' ), 'total_fees' )
	);
	newTotals.push(
		factory(
			__( 'Discount:', 'woo-gutenberg-products-block' ),
			'total_discount'
		)
	);
	newTotals.push( {
		label: __( 'Taxes:', 'woo-gutenberg-products-block' ),
		value: parseInt( totals.total_tax, 10 ),
		valueWithTax: parseInt( totals.total_tax, 10 ),
	} );
	if ( needsShipping ) {
		newTotals.push(
			factory(
				__( 'Shipping:', 'woo-gutenberg-products-block' ),
				'total_shipping'
			)
		);
	}
	return newTotals;
};

/**
 * @return {RegisteredPaymentMethodProps} Interface to use as payment method props.
 */
export const usePaymentMethodInterface = () => {
	const {
		isCalculating,
		isComplete,
		isIdle,
		isProcessing,
		onCheckoutAfterProcessingWithSuccess,
		onCheckoutAfterProcessingWithError,
		onCheckoutBeforeProcessing,
		onSubmit,
		customerId,
	} = useCheckoutContext();
	const {
		currentStatus,
		activePaymentMethod,
		onPaymentProcessing,
		setExpressPaymentError,
		shouldSavePayment,
	} = usePaymentMethodDataContext();
	const {
		shippingErrorStatus,
		shippingErrorTypes,
		shippingRates,
		shippingRatesLoading,
		selectedRates,
		setSelectedRates,
		isSelectingRate,

		onShippingRateSuccess,
		onShippingRateFail,
		onShippingRateSelectSuccess,
		onShippingRateSelectFail,
		needsShipping,
	} = useShippingDataContext();
	const {
		billingData,
		shippingAddress,
		setShippingAddress,
	} = useCustomerDataContext();
	const { cartTotals } = useStoreCart();
	const { appliedCoupons } = useStoreCartCoupons();
	const { noticeContexts, responseTypes } = useEmitResponse();
	const currentCartTotals = useRef(
		prepareTotalItems( cartTotals, needsShipping )
	);
	const currentCartTotal = useRef( {
		label: __( 'Total', 'woo-gutenberg-products-block' ),
		value: parseInt( cartTotals.total_price, 10 ),
	} );

	useEffect( () => {
		currentCartTotals.current = prepareTotalItems(
			cartTotals,
			needsShipping
		);
		currentCartTotal.current = {
			label: __( 'Total', 'woo-gutenberg-products-block' ),
			value: parseInt( cartTotals.total_price, 10 ),
		};
	}, [ cartTotals, needsShipping ] );

	return {
		checkoutStatus: {
			isCalculating,
			isComplete,
			isIdle,
			isProcessing,
		},
		paymentStatus: currentStatus,
		shippingStatus: {
			shippingErrorStatus,
			shippingErrorTypes,
		},
		shippingData: {
			shippingRates,
			shippingRatesLoading,
			selectedRates,
			setSelectedRates,
			isSelectingRate,
			shippingAddress,
			setShippingAddress,
			needsShipping,
		},
		billing: {
			billingData,
			cartTotal: currentCartTotal.current,
			currency: getCurrencyFromPriceResponse( cartTotals ),
			cartTotalItems: currentCartTotals.current,
			displayPricesIncludingTax: getSetting(
				'displayCartPricesIncludingTax',
				false
			),
			appliedCoupons,
			customerId,
		},
		eventRegistration: {
			onCheckoutAfterProcessingWithSuccess,
			onCheckoutAfterProcessingWithError,
			onCheckoutBeforeProcessing,
			onShippingRateSuccess,
			onShippingRateFail,
			onShippingRateSelectSuccess,
			onShippingRateSelectFail,
			onPaymentProcessing,
		},
		components: {
			ValidationInputError,
			PaymentMethodIcons,
			PaymentMethodLabel,
		},
		emitResponse: {
			noticeContexts,
			responseTypes,
		},
		onSubmit,
		activePaymentMethod,
		setExpressPaymentError,
		shouldSavePayment,
	};
};
