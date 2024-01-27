describe('Example01', () => {
  beforeEach(() => {
    cy.visit('/')
  })
  it('creates a map', () => {
    cy.get('[data-cy=example01] .ol-viewport').should('exist')
  })
})
