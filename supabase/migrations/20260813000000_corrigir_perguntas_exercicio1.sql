-- Corrigir perguntas do Exercício 1 (Dia 1 - Escovando os Dentes com Presença)
UPDATE public.exercicios 
SET perguntas = '[
  {"id":"p1","tipo":"radio","texto":"Como foi escovar os dentes procurando estar presente?","opcoes":["Foi fácil permanecer presente","Consegui em alguns momentos","Mente se distraiu muitas vezes","Não consegui perceber"]},
  {"id":"p2","tipo":"radio","texto":"Sua mente se afastou?","opcoes":["Sim","Não","Não percebi"]},
  {"id":"p3","tipo":"checkbox","texto":"O que você percebeu?","opcoes":["Pensamentos","Preocupações","Emoções","Sensações no corpo","Nada em especial"]},
  {"id":"p4","tipo":"texto","texto":"Observou algo que nunca havia percebido antes?"},
  {"id":"p5","tipo":"texto","texto":"Complete: Ao escovar com presença, percebi que..."}
]'::jsonb
WHERE semana = 1 AND dia = 1;
