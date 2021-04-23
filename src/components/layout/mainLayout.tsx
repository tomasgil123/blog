import React from 'react'
import styled from 'styled-components'

import Header from 'src/components/header'
import Footer from 'src/components/footer'

const Container = styled.div`
  overflow-x: hidden;
  position: relative;
  min-height: 100vh;
`

type LayoutProps = {
  children: React.ReactNode
}

const Layout: React.FunctionComponent<LayoutProps> = ({ children }) => {
  return (
    <Container>
      <Header showProgressBar={false} />
      <div className="pb-12">{children}</div>
      <Footer />
    </Container>
  )
}

export default Layout
