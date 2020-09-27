import React from 'react'
import styled from 'styled-components'
import { colors, space } from 'src/tokens/index'

const ContainerButton = styled.span`
  font-size: ${space.s5};
  cursor: pointer;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0) 60%, ${colors.base.deepSkyBlue} 50%);
`

type MainButtonProps = {
  text: string
  onClickButton: () => void
}

const MainButton: React.FC<MainButtonProps> = ({ text, onClickButton }) => {
  return <ContainerButton onClick={onClickButton}>{text}</ContainerButton>
}

export default MainButton
