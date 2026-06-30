import type { BuildPreset, SkillDefinition } from '../app/types'
import { Panel } from '../components/Panel'

interface SkillsPageProps {
  build: BuildPreset
  skills: SkillDefinition[]
}
export function SkillsPage({ build, skills }: SkillsPageProps) {
  const activeSkills = skills.filter((skill) => build.skillIds.includes(skill.id))

  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="section-kicker">Tomo de combate</p>
        <h1>Habilidades e comportamento</h1>
        <p>A personagem executa estas ordens automaticamente durante a tentativa.</p>
      </div>

      <Panel title="Habilidades equipadas" eyebrow={build.title}>
        <div className="skill-list">
          {activeSkills.map((skill, index) => (
            <article className="skill-row" key={skill.id}>
              <div className="skill-placeholder" aria-hidden="true">
                {index + 1}
              </div>
              <div className="skill-row__main">
                <span>{skill.kind}</span>
                <h3>{skill.name}</h3>
                <p>{skill.description}</p>
              </div>
              <dl className="skill-row__details">
                <div>
                  <dt>Custo</dt>
                  <dd>{skill.cost}</dd>
                </div>
                <div>
                  <dt>Recarga</dt>
                  <dd>{skill.cooldown}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="Prioridades de ação" eyebrow="Ordem configurada">
        <ol className="behavior-list">
          {build.behavior.map((rule, index) => (
            <li key={rule}>
              <span>Prioridade {index + 1}</span>
              <strong>{rule}</strong>
            </li>
          ))}
        </ol>
        <p className="form-note">
          A edição detalhada das condições será conectada quando o motor determinístico estiver disponível.
        </p>
      </Panel>
    </div>
  )
}
