import ormconfig from '@app/ormconfig';

const ormseedconfig = {
  ...ormconfig,
  migrations: ['src/seeds/*{.ts,.js}'],
};

export default ormseedconfig;
