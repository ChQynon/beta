import type { FC, PropsWithChildren } from 'react'
import Header from '@/widgets/header/Header'

const AILayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="mx-auto flex w-[92.5%] flex-col justify-center sm:max-w-[47rem] min-h-[calc(100vh-150px)]">
      <div className="mb-8 flex w-full flex-col">
        <Header />
        <div className="page-transition mt-4">
          {children}
        </div>
      </div>
    </div>
  )
}

export default AILayout 