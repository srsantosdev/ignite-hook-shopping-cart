import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const copyCart = cart.slice()
      const { data: stock } = await api.get<Stock>(`/stock/${productId}`)
      const { data: product } = await api.get(`/products/${productId}`)

      const findProductInCartIndex = copyCart.findIndex(
        cartProduct => cartProduct.id === productId
      )

      if (findProductInCartIndex > -1) {
        const productInCart = copyCart[findProductInCartIndex]
        const updatedAmount =  productInCart.amount + 1

        if (stock.amount < updatedAmount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        copyCart[findProductInCartIndex] = {
          ...productInCart,
          amount: updatedAmount
        };

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(copyCart));

        setCart(copyCart)
        return
      }

      if (stock.amount < 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      copyCart.push({
        ...product,
        amount: 1,
      })

      setCart(copyCart)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(copyCart));
    } catch {
      // TODO
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const copyCart = cart.slice()
      
      const findProductInCartIndex = copyCart.findIndex(
        cartProduct => cartProduct.id === productId
      )

      if(findProductInCartIndex < 0) {
        toast.error('Erro na remoção do produto')
        return;
      }

      copyCart.splice(findProductInCartIndex, 1)

      setCart(copyCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(copyCart));
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if(amount <= 0) {
        return;
      }

      const { data: stock } = await api.get<Stock>(`/stock/${productId}`)

      if(stock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');

        return;
      }

      const copyCart = cart.slice()
      
      const findProductInCartIndex = copyCart.findIndex(
        cartProduct => cartProduct.id === productId
      )

      const productInCart = copyCart[findProductInCartIndex]

      copyCart[findProductInCartIndex] = {
        ...productInCart,
        amount,
      };

      setCart(copyCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(copyCart));
    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
