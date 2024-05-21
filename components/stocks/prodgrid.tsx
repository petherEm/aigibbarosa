'use client'
import React, { useState } from 'react'
import Image from 'next/image'

const ProductGrid = ({ products }: { products: any[] }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div>
      <p className="font-inter mb-2 text-lg font-semibold">
        Here are our latest products:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Array.isArray(products) && products.length > 0 ? (
          products.map((product, index) => {
            const prices =
              product.variants && product.variants.length > 0
                ? product.variants[0].prices
                    .map((price: any) => {
                      const amount = (price.amount / 100).toFixed(2) // Convert amount from cents to a readable format
                      return `${amount} ${price.currency_code.toUpperCase()}`
                    })
                    .join(' or ')
                : 'Price not available'

            return (
              <div
                key={index}
                className="font-inter border rounded-lg shadow-md overflow-hidden"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="relative w-full h-48">
                  <Image
                    src={
                      hoveredIndex === index
                        ? product.images[1].url
                        : product.thumbnail
                    }
                    alt={product.title}
                    layout="fill"
                    objectFit="cover"
                    className="transition-opacity duration-300 ease-in-out"
                  />
                </div>
                <div className="p-4 max-h-[300px] flex flex-col gap-y-2">
                  <h3 className="text-lg font-bold">{product.title}</h3>
                  <h3>{prices}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {product.description}
                  </p>
                  <button
                    className="mt-4 w-full bg-black text-white py-2 rounded hover:scale-105 hover:bg-gray-800 transition duration-300 ease-in-out"
                    onClick={() => handleBuyNow(product.id)}
                  >
                    Buy Now
                  </button>
                  <button
                    className="mt-4 w-full border-[1.5px] border-black text-black py-2 rounded hover:scale-105 transition duration-300 ease-in-out"
                    onClick={() => tellMeMore(product.id)}
                  >
                    Tell Me More
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <p className="text-center text-gray-500 col-span-3">
            No products available
          </p>
        )}
      </div>
    </div>
  )
}

const handleBuyNow = (productId: string) => {
  // Handle the "Buy Now" button click
  // You can implement the logic for adding the product to the cart or redirecting to the product page
  console.log(`Buying product with ID: ${productId}`)
}

const tellMeMore = (productId: string) => {
  // Handle the "Tell Me More" button click
  // You can implement the logic for showing more details about the product
  console.log(`Telling more about product with ID: ${productId}`)
}

export default ProductGrid
