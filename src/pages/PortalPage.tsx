import { CHARACTER, META } from '../game/content'
import type { Game } from '../game/store'
import { PageHead, Panel, PowerBar } from '../ui/atoms'

const NEWS = [
  {
    date: '01 JUL',
    cat: 'Temporada',
    title: 'Cinzas do Abismo começou!',
    body: 'A liga oficial reiniciou economia e rankings. A mecânica "Fenda das Cinzas" concede fragmentos e um chefe com tabela de drop própria.',
  },
  {
    date: '28 JUN',
    cat: 'Motor',
    title: 'DPS real agora é descoberto na dungeon',
    body: 'Antes de testar, você vê apenas uma estimativa. Rode a build numa dungeon para conhecer o número real — trocar item, craftar ou mexer na árvore volta a esconder o DPS.',
  },
  {
    date: '25 JUN',
    cat: 'Crafting',
    title: 'Orbes e corrupção liberados',
    body: 'Transmutação, alteração, régio, exaltado, caos, divino e Vaal já podem ser aplicados aos seus itens no baú.',
  },
]

export function PortalPage({ game }: { game: Game }) {
  return (
    <>
      <PageHead title="Portal" crumb={`Notícias da Liga ${META.league}`} />
      <div className="layout-2">
        <div>
          <Panel title="Boas-vindas, estrategista">
            <div className="small">
              Você não controla os golpes — constrói a máquina que vence. A build sai <b>100% do que você
              equipa, aloca na árvore e socketa</b>. Não há arquétipos prontos: some poder por decisão própria e
              descubra o resultado real na dungeon.
            </div>
          </Panel>
          <Panel title="Poder de combate atual">
            <PowerBar power={game.power} knownDps={game.knownDps} />
            <div className="tiny muted mt8">
              Reforce dano na árvore ou nos suportes e as dungeons ficam mais rápidas — mas mantenha a resistência a
              fogo, ou o chefe ígneo te mata.
            </div>
          </Panel>
          <Panel title="Diário da Liga">
            <div className="news">
              {NEWS.map((n) => (
                <div className="news__item" key={n.title}>
                  <span className="news__date">{n.date}</span>
                  <span className="news__cat">{n.cat}</span>
                  <div className="news__title">{n.title}</div>
                  <div className="news__body">{n.body}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <div>
          <Panel title="Herói ativo">
            <div className="attr">
              <span className="k">Nome</span>
              <span className="v">{CHARACTER.name}</span>
            </div>
            <div className="attr">
              <span className="k">Classe</span>
              <span className="v">{CHARACTER.className}</span>
            </div>
            <div className="attr">
              <span className="k">Nível</span>
              <span className="v">{CHARACTER.level}</span>
            </div>
            <button className="btn btn--full mt8" onClick={() => game.navigate('equipamento')}>
              Abrir equipamento
            </button>
          </Panel>
          <Panel title="Estado do Servidor">
            <div className="attr">
              <span className="k">
                <span className="dot dot--on" /> Liga
              </span>
              <span className="v">ONLINE</span>
            </div>
            <div className="attr">
              <span className="k">Motor</span>
              <span className="v">{META.engine}</span>
            </div>
            <div className="attr">
              <span className="k">Tentativas hoje</span>
              <span className="v">18.402</span>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}
