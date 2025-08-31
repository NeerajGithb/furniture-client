'use client'

import React, { useState } from 'react'
import Image from 'next/image'

interface AccordionState {
    shop: boolean
    categories: boolean
    customerCare: boolean
}

const Footer: React.FC = () => {
    const [accordionState, setAccordionState] = useState<AccordionState>({
        shop: false,
        categories: false,
        customerCare: false
    })

    const [email, setEmail] = useState('')
    const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle')

    const currentYear = new Date().getFullYear()

    const toggleAccordion = (section: keyof AccordionState) => {
        setAccordionState(prev => ({
            shop: false,
            categories: false,
            customerCare: false,
            [section]: !prev[section]
        }))
    }

    const validateEmail = (email: string): boolean => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return regex.test(email)
    }

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateEmail(email)) {
            setEmailStatus('error')
            return
        }
        setEmailStatus('success')
        setEmail('')
    }

    return (
        <footer className="bg-black text-white border-t border-gray-800">
            <div className="mx-auto px-3 sm:px-4 lg:px-6 max-w-6xl">
                {/* Main Footer Content */}
                <div className="py-8 lg:py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">

                        {/* Brand Section */}
                        <div className="lg:col-span-1">
                            <div className="mb-4">
                                <Image
                                    src="/logo.png"
                                    alt="Premium Furniture Logo"
                                    width={100}
                                    height={32}
                                    className="mb-3 filter invert"
                                />
                                <p className="text-gray-300 text-xs leading-relaxed">
                                    Crafting exceptional furniture<br />
                                    for discerning homes since 1985
                                </p>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-xs text-gray-400">
                                    <svg className="w-3 h-3 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>123 Furniture Ave, NY 10001</span>
                                </div>
                                <div className="flex items-center text-xs text-gray-400">
                                    <svg className="w-3 h-3 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span>+1 (555) 123-4567</span>
                                </div>
                                <div className="flex items-center text-xs text-gray-400">
                                    <svg className="w-3 h-3 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>hello@premiumfurniture.com</span>
                                </div>
                            </div>

                            {/* Social Icons */}
                            <div className="flex space-x-2">
                                {[
                                    { name: 'Instagram', icon: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.624 5.367 11.99 11.988 11.99s11.987-5.366 11.987-11.99C23.004 5.367 17.641.001 12.017.001zm0 21.417c-5.185 0-9.43-4.246-9.43-9.43s4.245-9.43 9.43-9.43 9.43 4.245 9.43 9.43-4.245 9.43-9.43 9.43z' },
                                    { name: 'Facebook', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
                                    { name: 'Pinterest', icon: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.739.097.118.11.221.081.343-.09.383-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.766-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.366 11.99-11.988C24.007 5.367 18.641.001 12.017.001z' },
                                    { name: 'YouTube', icon: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' }
                                ].map((social) => (
                                    <button
                                        key={social.name}
                                        className="text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 rounded-sm p-1"
                                        aria-label={`Follow us on ${social.name}`}
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d={social.icon} />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Navigation Columns - Desktop */}
                        <div className="hidden lg:block lg:col-span-2">
                            <div className="grid grid-cols-3 gap-6">

                                {/* Shop Column */}
                                <div>
                                    <h3 className="text-white font-medium mb-3 text-sm">Shop</h3>
                                    <ul className="space-y-2">
                                        {['All Products', 'New Arrivals', 'Best Sellers', 'Sale', 'Gift Cards'].map((item) => (
                                            <li key={item}>
                                                <a
                                                    href="#"
                                                    className="text-gray-400 hover:text-white hover:underline transition-colors duration-200 text-xs focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 rounded-sm"
                                                >
                                                    {item}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Categories Column */}
                                <div>
                                    <h3 className="text-white font-medium mb-3 text-sm">Categories</h3>
                                    <ul className="space-y-2">
                                        {['Living Room', 'Bedroom', 'Dining', 'Office', 'Outdoor', 'Storage', 'Lighting'].map((item) => (
                                            <li key={item}>
                                                <a
                                                    href="#"
                                                    className="text-gray-400 hover:text-white hover:underline transition-colors duration-200 text-xs focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 rounded-sm"
                                                >
                                                    {item}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Customer Care Column */}
                                <div>
                                    <h3 className="text-white font-medium mb-3 text-sm">Customer Care</h3>
                                    <ul className="space-y-2">
                                        {['Contact Us', 'Track Order', 'Returns & Refunds', 'Shipping Info', 'Warranty', 'Size Guide', 'FAQs'].map((item) => (
                                            <li key={item}>
                                                <a
                                                    href="#"
                                                    className="text-gray-400 hover:text-white hover:underline transition-colors duration-200 text-xs focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 rounded-sm"
                                                >
                                                    {item}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Accordions */}
                        <div className="lg:hidden space-y-3">
                            {/* Shop Accordion */}
                            <div className="border-b border-gray-800">
                                <button
                                    onClick={() => toggleAccordion('shop')}
                                    className="w-full flex justify-between items-center py-2 text-left focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 rounded-sm"
                                    aria-expanded={accordionState.shop}
                                    aria-controls="shop-content"
                                >
                                    <span className="text-white font-medium text-sm">Shop</span>
                                    <svg
                                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${accordionState.shop ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div
                                    id="shop-content"
                                    className={`overflow-hidden transition-all duration-200 ${accordionState.shop ? 'max-h-64 pb-3' : 'max-h-0'}`}
                                >
                                    <ul className="space-y-2 pl-3">
                                        {['All Products', 'New Arrivals', 'Best Sellers', 'Sale', 'Gift Cards'].map((item) => (
                                            <li key={item}>
                                                <a
                                                    href="#"
                                                    className="text-gray-400 hover:text-white hover:underline transition-colors duration-200 text-xs focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 rounded-sm"
                                                >
                                                    {item}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Categories Accordion */}
                            <div className="border-b border-gray-800">
                                <button
                                    onClick={() => toggleAccordion('categories')}
                                    className="w-full flex justify-between items-center py-2 text-left focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 rounded-sm"
                                    aria-expanded={accordionState.categories}
                                    aria-controls="categories-content"
                                >
                                    <span className="text-white font-medium text-sm">Categories</span>
                                    <svg
                                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${accordionState.categories ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div
                                    id="categories-content"
                                    className={`overflow-hidden transition-all duration-200 ${accordionState.categories ? 'max-h-64 pb-3' : 'max-h-0'}`}
                                >
                                    <ul className="space-y-2 pl-3">
                                        {['Living Room', 'Bedroom', 'Dining', 'Office', 'Outdoor', 'Storage', 'Lighting'].map((item) => (
                                            <li key={item}>
                                                <a
                                                    href="#"
                                                    className="text-gray-400 hover:text-white hover:underline transition-colors duration-200 text-xs focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 rounded-sm"
                                                >
                                                    {item}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Customer Care Accordion */}
                            <div className="border-b border-gray-800">
                                <button
                                    onClick={() => toggleAccordion('customerCare')}
                                    className="w-full flex justify-between items-center py-2 text-left focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 rounded-sm"
                                    aria-expanded={accordionState.customerCare}
                                    aria-controls="customer-care-content"
                                >
                                    <span className="text-white font-medium text-sm">Customer Care</span>
                                    <svg
                                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${accordionState.customerCare ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div
                                    id="customer-care-content"
                                    className={`overflow-hidden transition-all duration-200 ${accordionState.customerCare ? 'max-h-64 pb-3' : 'max-h-0'}`}
                                >
                                    <ul className="space-y-2 pl-3">
                                        {['Contact Us', 'Track Order', 'Returns & Refunds', 'Shipping Info', 'Warranty', 'Size Guide', 'FAQs'].map((item) => (
                                            <li key={item}>
                                                <a
                                                    href="#"
                                                    className="text-gray-400 hover:text-white hover:underline transition-colors duration-200 text-xs focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 rounded-sm"
                                                >
                                                    {item}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Store & Trust + Newsletter */}
                        <div className="lg:col-span-1 space-y-6">

                            {/* Newsletter Section */}
                            <div>
                                <h3 className="text-white font-medium mb-3 text-sm">Join Our Newsletter</h3>
                                <form onSubmit={handleEmailSubmit} className="space-y-2">
                                    <div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            className="w-full px-2 py-2 bg-gray-900 border border-gray-700 text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent rounded-sm"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-white text-black px-3 py-2 text-xs font-medium hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 rounded-sm"
                                    >
                                        Subscribe
                                    </button>
                                </form>
                                {emailStatus === 'success' && (
                                    <p className="text-green-400 text-xs mt-2">Thank you for subscribing!</p>
                                )}
                                {emailStatus === 'error' && (
                                    <p className="text-red-400 text-xs mt-2">Please enter a valid email address.</p>
                                )}
                            </div>

                            {/* Payment Icons */}
                            <div>
                                <h4 className="text-white font-medium mb-2 text-xs">We Accept</h4>
                                <div className="flex flex-wrap gap-1">
                                    {/* Visa */}
                                    <div className="bg-gray-800 border border-gray-700 p-1 rounded">
                                        <svg width="24" height="15" viewBox="0 0 32 20" className="fill-current text-blue-400">
                                            <path d="M13.3 7.9h-2.7l-1.7 8.2h2.7l1.7-8.2zm7.7 5.2c0-2.2-2.9-2.3-2.9-3.3 0-.3.3-.6 1-.7.3 0 1.2-.1 2.2.4l.4-1.8c-.5-.2-1.3-.4-2.2-.4-2.3 0-4 1.2-4 3 0 1.3 1.2 2 2.1 2.4.9.5 1.2.8 1.2 1.2 0 .6-.7.9-1.4.9-.9 0-1.9-.2-2.4-.5l-.4 1.9c.6.3 1.6.5 2.7.5 2.5 0 4.1-1.2 4.1-3.1l-.4-.5zm6.1-5.2h-2.1c-.6 0-1.1.4-1.3.9l-3.7 7.3h2.5s.4-1.1.5-1.4h3.1c.1.3.3 1.4.3 1.4h2.2l-1.5-8.2zm-2.6 5.1c.2-.5 1-2.7 1-2.7s.2-.5.3-.8l.2.9s.5 2.4.6 2.6h-2.1zm-8.8-5.1l-2.5 5.6-.3-1.4c-.5-1.7-2.1-3.5-3.9-4.4l2.4 8h2.5l3.8-8.8h-2z" />
                                        </svg>
                                    </div>

                                    {/* Mastercard */}
                                    <div className="bg-gray-800 border border-gray-700 p-1 rounded">
                                        <svg width="24" height="15" viewBox="0 0 32 20" className="fill-current">
                                            <circle cx="12" cy="10" r="6" className="text-red-400" />
                                            <circle cx="20" cy="10" r="6" className="text-yellow-400" />
                                            <path d="M16 6.5c1.2 1.1 2 2.7 2 4.5s-.8 3.4-2 4.5c-1.2-1.1-2-2.7-2-4.5s.8-3.4 2-4.5z" className="text-orange-400" />
                                        </svg>
                                    </div>

                                    {/* PayPal */}
                                    <div className="bg-gray-800 border border-gray-700 p-1 rounded">
                                        <svg width="24" height="15" viewBox="0 0 32 20" className="fill-current text-blue-400">
                                            <path d="M8.5 2h5.4c3.2 0 5.4 1.4 5.4 4.2 0 2.8-2.2 5.1-5.4 5.1h-2.7l-.8 3.7h-2.2L8.5 2zm2.2 1.8l-.6 2.8h2.7c1.6 0 2.7-.7 2.7-2.1 0-1.2-.9-1.8-2.4-1.8h-2.4zm6.8 0c-.1.5-.3 1.1-.5 1.6l-.5 2.2h1.6c1.1 0 1.8-.5 1.8-1.4 0-.8-.6-1.2-1.5-1.2h-.9z" />
                                        </svg>
                                    </div>

                                    {/* UPI */}
                                    <div className="bg-gray-800 border border-gray-700 p-1 rounded">
                                        <svg width="24" height="15" viewBox="0 0 32 20" className="fill-current text-orange-400">
                                            <rect x="4" y="4" width="24" height="12" rx="2" />
                                            <text x="16" y="12" fontSize="4" textAnchor="middle" className="fill-black font-bold">UPI</text>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Security Badges */}
                            <div>
                                <div className="flex space-x-1 mb-2">
                                    <div className="bg-gray-800 border border-gray-700 p-1 rounded">
                                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="bg-gray-800 border border-gray-700 p-1 rounded">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Policy Links */}
                            <div>
                                <ul className="space-y-1">
                                    {['Terms of Service', 'Privacy Policy', 'Shipping Policy', 'Returns Policy'].map((policy) => (
                                        <li key={policy}>
                                            <a
                                                href="#"
                                                className="text-gray-400 hover:text-white hover:underline transition-colors duration-200 text-xs focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 rounded-sm"
                                            >
                                                {policy}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">

                        {/* Copyright */}
                        <div className="text-center lg:text-left">
                            <p className="text-gray-400 text-xs">
                                © {currentYear} Premium Furniture. All rights reserved.
                            </p>
                        </div>

                        {/* Additional Links */}
                        <div className="flex items-center justify-center space-x-4">
                            <a
                                href="#"
                                className="text-gray-400 hover:text-white hover:underline transition-colors duration-200 text-xs focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 rounded-sm"
                            >
                                Accessibility
                            </a>
                            <a
                                href="#"
                                className="text-gray-400 hover:text-white hover:underline transition-colors duration-200 text-xs focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 rounded-sm"
                            >
                                Sitemap
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer;