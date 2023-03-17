const input = `
@Module({
  imports: [
    PrismaModule.forRoot({
      isGlobal: true,
      prismaServiceOptions: {
        prismaOptions: {
          log: [
            {
              emit: 'event',
              level: 'query',
            },
            {
              emit: 'stdout',
              level: 'error',
            },
            {
              emit: 'stdout',
              level: 'info',
            },
            {
              emit: 'stdout',
              level: 'warn',
            },
          ],
          errorFormat: 'colorless',
        },
        events: {
          query: logQueryEvent,
        },
      },
    }),
    ContentTypeBuilderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`;

const newModule = 'NewModule';

const regex =
  /(@Module\s*\(\s*{[^{}]*\bimports\b\s*:\s*\[(?:\s*(?:(['"]).+?\1\s*,?\s*)+)\s*\][^{}]*}\s*\))/g;

const match = regex.exec(input);

if (match) {
  const oldImports = match[1];
  const newImports = `${oldImports.slice(
    0,
    -1,
  )}, '${newModule}']${oldImports.slice(-1)}`;
  input = input.replace(oldImports, newImports);
  console.log(input);
} else {
  console.log('No match found.');
}
@Module\({\s*imports:\s*\[